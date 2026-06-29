package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.CallScreen
import com.example.ui.screens.DashboardScreen
import com.example.ui.screens.ProfileScreen
import com.example.ui.screens.WelcomeScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.ActiveCallState
import com.example.ui.viewmodel.MainViewModel
import com.example.ui.viewmodel.MatchmakingState
import com.example.ui.NotificationHelper

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        NotificationHelper.createNotificationChannel(this)
        enableEdgeToEdge()

        setContent {
            val viewModel: MainViewModel = viewModel()

            val currentUser by viewModel.currentUser.collectAsState()
            val allUsers by viewModel.allUsers.collectAsState()
            val friendStatuses by viewModel.friendStatuses.collectAsState()
            val chatPartner by viewModel.activeChatPartner.collectAsState()
            val chatMessages by viewModel.activeChatMessages.collectAsState()
            val matchmakingState by viewModel.matchmakingState.collectAsState()
            val activeCall by viewModel.activeCall.collectAsState()
            val isDarkTheme by viewModel.isDarkTheme.collectAsState()

            // Safe, robust local route management to prevent fragment/compose backstack crashes
            var currentScreen by remember { mutableStateOf("welcome") }

            // Session observer: automatically direct to dashboard when logged in
            LaunchedEffect(currentUser) {
                if (currentUser != null) {
                    currentScreen = "dashboard"
                } else {
                    currentScreen = "welcome"
                }
            }

            // Automate chat selection on matchmaking match success
            LaunchedEffect(matchmakingState) {
                val state = matchmakingState
                if (state is MatchmakingState.Matched) {
                    viewModel.selectChatPartner(state.user)
                    viewModel.resetMatchmaking()
                    currentScreen = "dashboard"
                }
            }

            MyApplicationTheme(darkTheme = isDarkTheme) {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
                        when (currentScreen) {
                            "welcome" -> {
                                WelcomeScreen(
                                    onNavigateToLogin = { currentScreen = "auth" },
                                    onNavigateToRegister = { currentScreen = "auth" }
                                )
                            }
                            "auth" -> {
                                AuthScreen(
                                    onLoginSuccess = { email ->
                                        viewModel.login(email)
                                    },
                                    onRegisterSuccess = { name, email, country, nativeLang, level ->
                                        viewModel.signUp(
                                            name = name,
                                            email = email,
                                            country = country,
                                            nativeLanguage = nativeLang,
                                            englishLevel = level,
                                            interests = listOf("Travel", "Music", "Tech") // Default recommended
                                        )
                                    }
                                )
                            }
                            "dashboard" -> {
                                currentUser?.let { user ->
                                    DashboardScreen(
                                        currentUser = user,
                                        allUsers = allUsers,
                                        friendStatuses = friendStatuses,
                                        chatPartner = chatPartner,
                                        chatMessages = chatMessages,
                                        matchmakingState = matchmakingState,
                                        isDarkTheme = isDarkTheme,
                                        onToggleTheme = { viewModel.toggleTheme() },
                                        onLogout = { viewModel.logout() },
                                        onNavigateToEditProfile = { currentScreen = "edit_profile" },
                                        onStartMatchmaking = { viewModel.startMatchmaking() },
                                        onCancelMatchmaking = { viewModel.cancelMatchmaking() },
                                        onSelectPartner = { viewModel.selectChatPartner(it) },
                                        onSendMessage = { viewModel.sendMessage(it) },
                                        onToggleFriend = { viewModel.toggleFriend(it) },
                                        onBlockUser = { viewModel.blockUser(it) },
                                        onReportUser = { viewModel.reportUser(it) },
                                        onStartCall = { peer, isVideo -> viewModel.startCall(peer, isVideo) }
                                    )
                                }
                            }
                            "edit_profile" -> {
                                currentUser?.let { user ->
                                    ProfileScreen(
                                        user = user,
                                        onSaveProfile = { updated ->
                                            viewModel.updateProfile(updated)
                                            currentScreen = "dashboard"
                                        }
                                    )
                                }
                            }
                        }

                        // --- Interactive Voice / Video Call Overlay Panel ---
                        if (activeCall != ActiveCallState.None) {
                            val activeCallState = activeCall
                            val (peer, isVideo, duration) = when (activeCallState) {
                                is ActiveCallState.Voice -> Triple(activeCallState.user, false, activeCallState.durationSeconds)
                                is ActiveCallState.Video -> Triple(activeCallState.user, true, activeCallState.durationSeconds)
                                else -> Triple(null, false, 0)
                            }
                            peer?.let { user ->
                                CallScreen(
                                    user = user,
                                    isVideo = isVideo,
                                    durationSeconds = duration,
                                    onEndCall = { viewModel.endCall() }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
