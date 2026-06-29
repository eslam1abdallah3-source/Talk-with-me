package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.local.FriendEntity
import com.example.data.local.Message
import com.example.data.local.User
import com.example.data.repository.EnglishCircleRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface MatchmakingState {
    object Idle : MatchmakingState
    object Matching : MatchmakingState
    data class Matched(val user: User) : MatchmakingState
    data class Error(val message: String) : MatchmakingState
}

sealed interface ActiveCallState {
    object None : ActiveCallState
    data class Voice(val user: User, val durationSeconds: Int = 0) : ActiveCallState
    data class Video(val user: User, val durationSeconds: Int = 0) : ActiveCallState
}

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = EnglishCircleRepository(application)

    // --- Authentication & Session ---
    val currentUser: StateFlow<User?> = repository.getMeFlow().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    // --- Users ---
    val allUsers: StateFlow<List<User>> = repository.getOtherUsersFlow().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val friendStatuses: StateFlow<List<FriendEntity>> = repository.getFriendStatusesFlow().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Combined Flow: Friend Users Only
    val friendUsers: StateFlow<List<User>> = combine(allUsers, friendStatuses) { users, statuses ->
        val friendIds = statuses.filter { it.isFriend }.map { it.userId }.toSet()
        users.filter { friendIds.contains(it.id) }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // --- Matchmaking ---
    private val _matchmakingState = MutableStateFlow<MatchmakingState>(MatchmakingState.Idle)
    val matchmakingState: StateFlow<MatchmakingState> = _matchmakingState.asStateFlow()

    private var matchJob: Job? = null

    // --- Active Chat ---
    private val _activeChatPartner = MutableStateFlow<User?>(null)
    val activeChatPartner: StateFlow<User?> = _activeChatPartner.asStateFlow()

    val activeChatMessages: StateFlow<List<Message>> = _activeChatPartner.flatMapLatest { partner ->
        if (partner == null) {
            flowOf(emptyList())
        } else {
            repository.getChatMessagesFlow(partner.id)
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // --- Active Simulated Calls ---
    private val _activeCall = MutableStateFlow<ActiveCallState>(ActiveCallState.None)
    val activeCall: StateFlow<ActiveCallState> = _activeCall.asStateFlow()

    private var callTimerJob: Job? = null

    // --- Theme State (User Preferences) ---
    private val _isDarkTheme = MutableStateFlow(false)
    val isDarkTheme: StateFlow<Boolean> = _isDarkTheme.asStateFlow()

    // --- Auth Actions ---

    fun signUp(name: String, email: String, country: String, nativeLanguage: String, englishLevel: String, interests: List<String>) {
        viewModelScope.launch {
            repository.signUp(email, name, country, nativeLanguage, englishLevel, interests)
        }
    }

    fun login(email: String) {
        viewModelScope.launch {
            repository.login(email)
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _activeChatPartner.value = null
            _activeCall.value = ActiveCallState.None
        }
    }

    fun updateProfile(user: User) {
        viewModelScope.launch {
            repository.updateProfile(user)
        }
    }

    // --- Matchmaking Actions ---

    fun startMatchmaking() {
        val me = currentUser.value ?: return
        _matchmakingState.value = MatchmakingState.Matching
        matchJob?.cancel()
        matchJob = viewModelScope.launch {
            val matched = repository.findMatch(me.englishLevel, me.interests)
            if (matched != null) {
                _matchmakingState.value = MatchmakingState.Matched(matched)
                _activeChatPartner.value = matched
            } else {
                _matchmakingState.value = MatchmakingState.Error("No online speakers found. Please try again later.")
            }
        }
    }

    fun cancelMatchmaking() {
        matchJob?.cancel()
        _matchmakingState.value = MatchmakingState.Idle
    }

    fun resetMatchmaking() {
        _matchmakingState.value = MatchmakingState.Idle
    }

    // --- Active Chat Actions ---

    fun selectChatPartner(partner: User?) {
        _activeChatPartner.value = partner
    }

    fun sendMessage(text: String) {
        val partner = activeChatPartner.value ?: return
        if (text.isBlank()) return
        viewModelScope.launch {
            repository.sendMessage(partner.id, text)
        }
    }

    // --- Social / Moderation Actions ---

    fun toggleFriend(userId: String) {
        viewModelScope.launch {
            repository.toggleFriend(userId)
        }
    }

    fun blockUser(userId: String) {
        viewModelScope.launch {
            repository.blockUser(userId)
            if (_activeChatPartner.value?.id == userId) {
                _activeChatPartner.value = null
            }
        }
    }

    fun reportUser(userId: String) {
        viewModelScope.launch {
            repository.reportUser(userId)
            if (_activeChatPartner.value?.id == userId) {
                _activeChatPartner.value = null
            }
        }
    }

    // --- Call / Multimedia Simulation ---

    fun startCall(user: User, isVideo: Boolean) {
        callTimerJob?.cancel()
        _activeCall.value = if (isVideo) {
            ActiveCallState.Video(user, 0)
        } else {
            ActiveCallState.Voice(user, 0)
        }
        
        // Start counting call duration
        callTimerJob = viewModelScope.launch {
            while (true) {
                kotlinx.coroutines.delay(1000)
                val current = _activeCall.value
                _activeCall.value = when (current) {
                    is ActiveCallState.Video -> current.copy(durationSeconds = current.durationSeconds + 1)
                    is ActiveCallState.Voice -> current.copy(durationSeconds = current.durationSeconds + 1)
                    ActiveCallState.None -> break
                }
            }
        }
    }

    fun endCall() {
        callTimerJob?.cancel()
        _activeCall.value = ActiveCallState.None
    }

    // --- Theme Settings ---

    fun toggleTheme() {
        _isDarkTheme.value = !_isDarkTheme.value
    }
}
