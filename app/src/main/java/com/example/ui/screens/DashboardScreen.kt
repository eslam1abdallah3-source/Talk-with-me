package com.example.ui.screens

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.border
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.PersonRemove
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Report
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.VideoCall
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VoiceChat
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.FriendEntity
import com.example.data.local.Message
import com.example.data.local.User
import com.example.ui.theme.BlockedGray
import com.example.ui.theme.BluePrimary
import com.example.ui.theme.ErrorRed
import com.example.ui.theme.GradientEnd
import com.example.ui.theme.GradientMiddle
import com.example.ui.theme.GradientStart
import com.example.ui.theme.SuccessGreen
import com.example.ui.viewmodel.MatchmakingState

@Composable
fun DashboardScreen(
    currentUser: User,
    allUsers: List<User>,
    friendStatuses: List<FriendEntity>,
    chatPartner: User?,
    chatMessages: List<Message>,
    matchmakingState: MatchmakingState,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    onLogout: () -> Unit,
    onNavigateToEditProfile: () -> Unit,
    onStartMatchmaking: () -> Unit,
    onCancelMatchmaking: () -> Unit,
    onSelectPartner: (User?) -> Unit,
    onSendMessage: (String) -> Unit,
    onToggleFriend: (String) -> Unit,
    onBlockUser: (String) -> Unit,
    onReportUser: (String) -> Unit,
    onStartCall: (User, Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedBottomTab by remember { mutableStateOf(0) } // 0 = Home, 1 = Chat, 2 = Community/Friends

    // Keep navigation robust
    val mappedFriends = remember(allUsers, friendStatuses) {
        val friendIds = friendStatuses.filter { it.isFriend }.map { it.userId }.toSet()
        allUsers.filter { friendIds.contains(it.id) }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        bottomBar = {
            NavigationBar(
                tonalElevation = 8.dp,
                modifier = Modifier.testTag("dashboard_bottom_navigation")
            ) {
                NavigationBarItem(
                    selected = selectedBottomTab == 0,
                    onClick = { selectedBottomTab = 0 },
                    icon = { Icon(Icons.Default.People, contentDescription = "Home") },
                    label = { Text("Home", fontWeight = FontWeight.SemiBold) },
                    modifier = Modifier.testTag("nav_home_tab")
                )
                NavigationBarItem(
                    selected = selectedBottomTab == 1,
                    onClick = { selectedBottomTab = 1 },
                    icon = { Icon(Icons.Default.Forum, contentDescription = "Chat") },
                    label = { Text("Chat", fontWeight = FontWeight.SemiBold) },
                    modifier = Modifier.testTag("nav_chat_tab")
                )
                NavigationBarItem(
                    selected = selectedBottomTab == 2,
                    onClick = { selectedBottomTab = 2 },
                    icon = { Icon(Icons.Default.Search, contentDescription = "Community") },
                    label = { Text("Community", fontWeight = FontWeight.SemiBold) },
                    modifier = Modifier.testTag("nav_community_tab")
                )
            }
        }
    ) { innerPadding ->
        Crossfade(
            targetState = selectedBottomTab,
            modifier = Modifier.padding(innerPadding),
            label = "tab_crossfade"
        ) { tab ->
            when (tab) {
                0 -> HomeScreen(
                    currentUser = currentUser,
                    allUsers = allUsers,
                    friendStatuses = friendStatuses,
                    matchmakingState = matchmakingState,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = onToggleTheme,
                    onLogout = onLogout,
                    onEditProfile = onNavigateToEditProfile,
                    onStartMatch = onStartMatchmaking,
                    onCancelMatch = onCancelMatchmaking,
                    onSelectUser = { user ->
                        onSelectPartner(user)
                        selectedBottomTab = 1 // Open Chat tab immediately
                    }
                )
                1 -> ChatScreen(
                    currentUser = currentUser,
                    partner = chatPartner,
                    messages = chatMessages,
                    friendStatuses = friendStatuses,
                    onSendMessage = onSendMessage,
                    onToggleFriend = onToggleFriend,
                    onBlock = onBlockUser,
                    onReport = onReportUser,
                    onStartVoiceCall = { onStartCall(it, false) },
                    onStartVideoCall = { onStartCall(it, true) },
                    onCloseChat = { onSelectPartner(null) }
                )
                2 -> CommunityScreen(
                    allUsers = allUsers,
                    friendsList = mappedFriends,
                    friendStatuses = friendStatuses,
                    onSelectUser = { user ->
                        onSelectPartner(user)
                        selectedBottomTab = 1 // Redirect to chat tab
                    },
                    onToggleFriend = onToggleFriend,
                    onBlockUser = onBlockUser
                )
            }
        }
    }
}

// ==========================================
// --- 1. HOME / MATCHMAKING TAB ---
// ==========================================

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun HomeScreen(
    currentUser: User,
    allUsers: List<User>,
    friendStatuses: List<FriendEntity>,
    matchmakingState: MatchmakingState,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    onLogout: () -> Unit,
    onEditProfile: () -> Unit,
    onStartMatch: () -> Unit,
    onCancelMatch: () -> Unit,
    onSelectUser: (User) -> Unit,
    modifier: Modifier = Modifier
) {
    val blockedIds = remember(friendStatuses) {
        friendStatuses.filter { it.isBlocked }.map { it.userId }.toSet()
    }

    val activeOnlineUsers = remember(allUsers, blockedIds) {
        allUsers.filter { it.isOnline && !blockedIds.contains(it.id) }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 20.dp)
    ) {
        // --- Profile Header ---
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "English Circle".uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Hello, ${currentUser.name}!",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onToggleTheme,
                        modifier = Modifier.testTag("toggle_theme_button")
                    ) {
                        Icon(
                            imageVector = if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                            contentDescription = "Toggle Light/Dark Theme"
                        )
                    }
                    IconButton(
                        onClick = onEditProfile,
                        modifier = Modifier.testTag("edit_profile_shortcut")
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit Profile")
                    }
                    IconButton(
                        onClick = onLogout,
                        modifier = Modifier.testTag("logout_button")
                    ) {
                        Icon(Icons.Default.Logout, contentDescription = "Logout")
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    // Profile Initials Avatar
                    Box(contentAlignment = Alignment.BottomEnd) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .border(2.dp, Color.White, CircleShape)
                                .background(
                                    Brush.linearGradient(
                                        colors = listOf(GradientStart, GradientMiddle, GradientEnd)
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = currentUser.name.take(2).uppercase(),
                                style = MaterialTheme.typography.titleSmall,
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        // Absolute Bottom-Right Green Dot
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(SuccessGreen)
                                .border(2.dp, Color.White, CircleShape)
                        )
                    }
                }
            }
        }

        // --- Matchmaking Card Area ---
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                shape = RoundedCornerShape(32.dp),
                border = BorderStroke(1.dp, if (isDarkTheme) Color(0xFF334155) else Color(0xFFE2E8F0)),
                colors = CardDefaults.cardColors(
                    containerColor = if (isDarkTheme) Color(0xFF1E293B) else Color.White
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                ) {
                    // Top row: Header info & English Level Tag
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column {
                            Text(
                                text = "Ready to practice?",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = if (isDarkTheme) Color.White else Color(0xFF1E293B)
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "2,481 partners are online now",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (isDarkTheme) Color.LightGray.copy(alpha = 0.7f) else Color(0xFF64748B)
                            )
                        }

                        // English Level Tag
                        Box(
                            modifier = Modifier
                                .background(
                                    color = if (isDarkTheme) Color(0xFF0F172A) else Color(0xFFEFF6FF),
                                    shape = RoundedCornerShape(20.dp)
                                )
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = currentUser.englishLevel,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = if (isDarkTheme) Color(0xFF38BDF8) else Color(0xFF005CB9)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Conditional UI based on Matchmaking State
                    when (matchmakingState) {
                        is MatchmakingState.Idle -> {
                            Button(
                                onClick = onStartMatch,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF005CB9),
                                    contentColor = Color.White
                                ),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(54.dp)
                                    .testTag("start_matching_button")
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Bolt,
                                        contentDescription = "Bolt",
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        "Start Quick Match",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                }
                            }
                        }
                        is MatchmakingState.Matching -> {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(
                                        color = if (isDarkTheme) Color(0xFF334155) else Color(0xFFF1F5F9),
                                        shape = RoundedCornerShape(16.dp)
                                    )
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    CircularProgressIndicator(
                                        color = Color(0xFF005CB9),
                                        modifier = Modifier.size(24.dp),
                                        strokeWidth = 3.dp
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(
                                        "Finding your match...",
                                        color = if (isDarkTheme) Color.White else Color(0xFF1E293B),
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 14.sp
                                    )
                                }
                                Button(
                                    onClick = onCancelMatch,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (isDarkTheme) Color(0xFF475569) else Color(0xFFE2E8F0),
                                        contentColor = if (isDarkTheme) Color.White else Color(0xFF475569)
                                    ),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.testTag("cancel_matching_button")
                                ) {
                                    Text("Cancel", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }
                        is MatchmakingState.Matched -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(
                                        color = if (isDarkTheme) Color(0xFF0F172A) else Color(0xFFECFDF5),
                                        shape = RoundedCornerShape(16.dp)
                                    )
                                    .padding(16.dp)
                            ) {
                                Text(
                                    "Matched with ${matchmakingState.user.name}! Connecting...",
                                    color = if (isDarkTheme) Color(0xFF34D399) else Color(0xFF059669),
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                        is MatchmakingState.Error -> {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(
                                        color = if (isDarkTheme) Color(0xFF451A03) else Color(0xFFFEF2F2),
                                        shape = RoundedCornerShape(16.dp)
                                    )
                                    .padding(16.dp)
                            ) {
                                Text(
                                    text = matchmakingState.message,
                                    color = if (isDarkTheme) Color(0xFFFCA5A5) else Color(0xFFDC2626),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(
                                    onClick = onStartMatch,
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.align(Alignment.End)
                                ) {
                                    Text("Retry", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Bottom horizontal items representation
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Text option
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(
                                        color = if (isDarkTheme) Color(0xFF334155) else Color(0xFFF8FAFF),
                                        shape = CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ChatBubble,
                                    contentDescription = null,
                                    tint = if (isDarkTheme) Color.LightGray else Color(0xFF64748B),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                "Text",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isDarkTheme) Color.LightGray else Color(0xFF475569)
                            )
                        }

                        // Voice option
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(
                                        color = if (isDarkTheme) Color(0xFF334155) else Color(0xFFF8FAFF),
                                        shape = CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Call,
                                    contentDescription = null,
                                    tint = if (isDarkTheme) Color.LightGray else Color(0xFF64748B),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                "Voice",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isDarkTheme) Color.LightGray else Color(0xFF475569)
                            )
                        }

                        // Video option
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(
                                        color = if (isDarkTheme) Color(0xFF334155) else Color(0xFFF8FAFF),
                                        shape = CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Videocam,
                                    contentDescription = null,
                                    tint = if (isDarkTheme) Color.LightGray else Color(0xFF64748B),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                "Video",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isDarkTheme) Color.LightGray else Color(0xFF475569)
                            )
                        }
                    }
                }
            }
        }

        // --- Horizontal Scrolling Active Speaker List ---
        item {
            Text(
                text = "Active Speakers Circles",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            if (activeOnlineUsers.isEmpty()) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "No online speakers currently active.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 24.dp)
                ) {
                    items(activeOnlineUsers) { speaker ->
                        val avatarColor = remember(speaker.id) {
                            val colors = listOf(
                                Color(0xFFEFF6FF) to Color(0xFF1D4ED8), // Blue
                                Color(0xFFF5F3FF) to Color(0xFF6D28D9), // Purple
                                Color(0xFFECFDF5) to Color(0xFF047857), // Green
                                Color(0xFFFFF7ED) to Color(0xFFC2410C)  // Orange
                            )
                            colors[speaker.id.hashCode().coerceAtLeast(0) % colors.size]
                        }

                        Card(
                            modifier = Modifier
                                .width(140.dp)
                                .clickable { onSelectUser(speaker) }
                                .testTag("speaker_circle_card_${speaker.id}"),
                            shape = RoundedCornerShape(20.dp),
                            border = BorderStroke(1.dp, if (isDarkTheme) Color(0xFF334155) else Color(0xFFF1F5F9)),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isDarkTheme) Color(0xFF1E293B) else Color.White
                            ),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Box(contentAlignment = Alignment.BottomEnd) {
                                    Box(
                                        modifier = Modifier
                                            .size(52.dp)
                                            .clip(CircleShape)
                                            .background(if (isDarkTheme) Color(0xFF334155) else avatarColor.first),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = speaker.name.take(2).uppercase(),
                                            color = if (isDarkTheme) Color.White else avatarColor.second,
                                            fontWeight = FontWeight.Bold,
                                            style = MaterialTheme.typography.titleMedium
                                        )
                                    }
                                    // Online green indicator dot
                                    Box(
                                        modifier = Modifier
                                            .size(12.dp)
                                            .clip(CircleShape)
                                            .background(SuccessGreen)
                                            .border(2.dp, if (isDarkTheme) Color(0xFF1E293B) else Color.White, CircleShape)
                                    )
                                }
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = speaker.name,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    textAlign = TextAlign.Center,
                                    color = if (isDarkTheme) Color.White else Color(0xFF1E293B)
                                )
                                Text(
                                    text = speaker.country,
                                    fontSize = 11.sp,
                                    color = if (isDarkTheme) Color.LightGray.copy(alpha = 0.6f) else Color(0xFF64748B),
                                    textAlign = TextAlign.Center,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Box(
                                    modifier = Modifier
                                        .background(
                                            color = if (isDarkTheme) Color(0xFF0F172A) else Color(0xFFF0F9FF),
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                        .padding(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        text = speaker.englishLevel,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isDarkTheme) Color(0xFF38BDF8) else Color(0xFF0284C7)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // --- All Members Directory Section ---
        item {
            Text(
                text = "Community Speakers",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 12.dp, top = 8.dp)
            )
        }

        val nonBlockedAllUsers = allUsers.filter { !blockedIds.contains(it.id) }
        items(nonBlockedAllUsers) { user ->
            val avatarColor = remember(user.id) {
                val colors = listOf(
                    Color(0xFFEFF6FF) to Color(0xFF1D4ED8), // Blue
                    Color(0xFFF5F3FF) to Color(0xFF6D28D9), // Purple
                    Color(0xFFECFDF5) to Color(0xFF047857), // Green
                    Color(0xFFFFF7ED) to Color(0xFFC2410C)  // Orange
                )
                colors[user.id.hashCode().coerceAtLeast(0) % colors.size]
            }

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
                    .clickable { onSelectUser(user) }
                    .testTag("speaker_list_card_${user.id}"),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, if (isDarkTheme) Color(0xFF334155) else Color(0xFFF1F5F9)),
                colors = CardDefaults.cardColors(
                    containerColor = if (isDarkTheme) Color(0xFF1E293B) else Color.White
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(contentAlignment = Alignment.BottomEnd) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(if (isDarkTheme) Color(0xFF334155) else avatarColor.first),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = user.name.take(2).uppercase(),
                                color = if (isDarkTheme) Color.White else avatarColor.second,
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                        Box(
                            modifier = Modifier
                                .size(11.dp)
                                .clip(CircleShape)
                                .background(if (user.isOnline) SuccessGreen else Color.Gray)
                                .border(1.5.dp, if (isDarkTheme) Color(0xFF1E293B) else Color.White, CircleShape)
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = user.name,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = if (isDarkTheme) Color.White else Color(0xFF1E293B)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            // Level Badge
                            Box(
                                modifier = Modifier
                                    .background(
                                        color = if (isDarkTheme) Color(0xFF0F172A) else Color(0xFFEFF6FF),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = user.englishLevel,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isDarkTheme) Color(0xFF38BDF8) else Color(0xFF005CB9)
                                )
                            }
                        }
                        Text(
                            text = "Native: ${user.nativeLanguage} • Speaks English",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (isDarkTheme) Color.LightGray.copy(alpha = 0.6f) else Color(0xFF64748B)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            user.interests.take(3).forEach { interest ->
                                Box(
                                    modifier = Modifier
                                        .background(
                                            if (isDarkTheme) Color(0xFF334155) else Color(0xFFF1F5F9),
                                            RoundedCornerShape(6.dp)
                                        )
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        text = interest,
                                        fontSize = 9.sp,
                                        color = if (isDarkTheme) Color.LightGray else Color(0xFF475569)
                                    )
                                }
                            }
                        }
                    }

                    IconButton(
                        onClick = { onSelectUser(user) },
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = if (isDarkTheme) Color(0xFF334155) else Color(0xFFF0F9FF)
                        ),
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Forum,
                            contentDescription = "Open Chat with ${user.name}",
                            tint = Color(0xFF005CB9),
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

// ==========================================
// --- 2. ACTIVE TEXT CHAT TAB ---
// ==========================================

@Composable
fun ChatScreen(
    currentUser: User,
    partner: User?,
    messages: List<Message>,
    friendStatuses: List<FriendEntity>,
    onSendMessage: (String) -> Unit,
    onToggleFriend: (String) -> Unit,
    onBlock: (String) -> Unit,
    onReport: (String) -> Unit,
    onStartVoiceCall: (User) -> Unit,
    onStartVideoCall: (User) -> Unit,
    onCloseChat: () -> Unit,
    modifier: Modifier = Modifier
) {
    var text by remember { mutableStateOf("") }
    var menuExpanded by remember { mutableStateOf(false) }

    val isFriend = remember(partner, friendStatuses) {
        partner?.let { p -> friendStatuses.any { it.userId == p.id && it.isFriend } } ?: false
    }

    if (partner == null) {
        // Chat Empty State
        Column(
            modifier = modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Forum,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(40.dp)
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Select an Active Speaker",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Select a speaker from the Home dashboard circles, use the Matchmaking Engine, or find friends from the Community tab to start practicing your speaking!",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                textAlign = TextAlign.Center,
                lineHeight = 22.sp,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    } else {
        // Active Chat Interface
        Column(
            modifier = modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Chat Toolbar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    val isDarkTheme = isSystemInDarkTheme()
                    val avatarColor = remember(partner.id) {
                        val colors = listOf(
                            Color(0xFFEFF6FF) to Color(0xFF1D4ED8), // Blue
                            Color(0xFFF5F3FF) to Color(0xFF6D28D9), // Purple
                            Color(0xFFECFDF5) to Color(0xFF047857), // Green
                            Color(0xFFFFF7ED) to Color(0xFFC2410C)  // Orange
                        )
                        colors[partner.id.hashCode().coerceAtLeast(0) % colors.size]
                    }

                    Box(contentAlignment = Alignment.BottomEnd) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(if (isDarkTheme) Color(0xFF334155) else avatarColor.first),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = partner.name.take(2).uppercase(),
                                color = if (isDarkTheme) Color.White else avatarColor.second,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                        Box(
                            modifier = Modifier
                                .size(11.dp)
                                .clip(CircleShape)
                                .background(if (partner.isOnline) SuccessGreen else Color.Gray)
                                .border(1.5.dp, if (isDarkTheme) Color(0xFF1E293B) else Color.White, CircleShape)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = partner.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = if (partner.isOnline) "Active now • Level: ${partner.englishLevel}" else "Offline",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }

                // Action Call & Dropdown Menu buttons
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = { onStartVoiceCall(partner) },
                        modifier = Modifier.testTag("voice_call_button")
                    ) {
                        Icon(Icons.Default.VoiceChat, contentDescription = "Voice Call", tint = BluePrimary)
                    }
                    IconButton(
                        onClick = { onStartVideoCall(partner) },
                        modifier = Modifier.testTag("video_call_button")
                    ) {
                        Icon(Icons.Default.VideoCall, contentDescription = "Video Call", tint = BluePrimary)
                    }

                    Box {
                        IconButton(
                            onClick = { menuExpanded = true },
                            modifier = Modifier.testTag("chat_more_options")
                        ) {
                            Icon(Icons.Default.MoreVert, contentDescription = "Options")
                        }
                        DropdownMenu(
                            expanded = menuExpanded,
                            onDismissRequest = { menuExpanded = false }
                        ) {
                            DropdownMenuItem(
                                text = {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = if (isFriend) Icons.Default.PersonRemove else Icons.Default.PersonAdd,
                                            contentDescription = null,
                                            tint = BluePrimary
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(if (isFriend) "Remove Friend" else "Add Friend")
                                    }
                                },
                                onClick = {
                                    onToggleFriend(partner.id)
                                    menuExpanded = false
                                }
                            )
                            DropdownMenuItem(
                                text = {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Block, contentDescription = null, tint = ErrorRed)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Block User", color = ErrorRed)
                                    }
                                },
                                onClick = {
                                    onBlock(partner.id)
                                    menuExpanded = false
                                }
                            )
                            DropdownMenuItem(
                                text = {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Report, contentDescription = null, tint = ErrorRed)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Report Profile", color = ErrorRed)
                                    }
                                },
                                onClick = {
                                    onReport(partner.id)
                                    menuExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            // Chat Messages list thread
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                reverseLayout = false,
                verticalArrangement = Arrangement.Bottom
            ) {
                // Info header card representing matched interests
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 16.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "Speaking Circle Matched!",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleSmall
                            )
                            Text(
                                text = "You share common interests: ${partner.interests.take(3).joinToString(", ")}.",
                                style = MaterialTheme.typography.bodySmall,
                                textAlign = TextAlign.Center,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }
                }

                items(messages) { msg ->
                    val isMe = msg.senderId == currentUser.id || msg.senderId == "me"
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = if (isMe) Arrangement.End else Arrangement.Start
                    ) {
                        Card(
                            shape = RoundedCornerShape(
                                topStart = 16.dp,
                                topEnd = 16.dp,
                                bottomStart = if (isMe) 16.dp else 2.dp,
                                bottomEnd = if (isMe) 2.dp else 16.dp
                            ),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isMe) BluePrimary else MaterialTheme.colorScheme.surface
                            ),
                            modifier = Modifier.widthIn(max = 280.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = msg.text,
                                    color = if (isMe) Color.White else MaterialTheme.colorScheme.onSurface,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
            }

            // Message text input bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = text,
                    onValueChange = { text = it },
                    placeholder = { Text("Practice English here...") },
                    modifier = Modifier
                        .weight(1f)
                        .testTag("chat_text_input"),
                    shape = RoundedCornerShape(24.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BluePrimary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f)
                    ),
                    maxLines = 3
                )
                Spacer(modifier = Modifier.width(8.dp))
                IconButton(
                    onClick = {
                        if (text.isNotBlank()) {
                            onSendMessage(text)
                            text = ""
                        }
                    },
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(BluePrimary)
                        .testTag("send_message_button"),
                    colors = IconButtonDefaults.iconButtonColors(containerColor = BluePrimary)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Send Message",
                        tint = Color.White
                    )
                }
            }
        }
    }
}

// ==========================================
// --- 3. COMMUNITY & FRIENDS TAB ---
// ==========================================

@Composable
fun CommunityScreen(
    allUsers: List<User>,
    friendsList: List<User>,
    friendStatuses: List<FriendEntity>,
    onSelectUser: (User) -> Unit,
    onToggleFriend: (String) -> Unit,
    onBlockUser: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var showOnlyFriends by remember { mutableStateOf(false) }

    val blockedIds = remember(friendStatuses) {
        friendStatuses.filter { it.isBlocked }.map { it.userId }.toSet()
    }

    val filteredList = remember(searchQuery, showOnlyFriends, allUsers, friendsList, blockedIds) {
        val baseList = if (showOnlyFriends) friendsList else allUsers
        baseList.filter { user ->
            !blockedIds.contains(user.id) && (
                user.name.contains(searchQuery, ignoreCase = true) ||
                user.country.contains(searchQuery, ignoreCase = true) ||
                user.nativeLanguage.contains(searchQuery, ignoreCase = true) ||
                user.interests.any { it.contains(searchQuery, ignoreCase = true) } ||
                user.englishLevel.contains(searchQuery, ignoreCase = true)
            )
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(20.dp)
    ) {
        Text(
            text = "English Community",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // Search Input field
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search by name, country, interests, or level...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            modifier = Modifier
                .fillMaxWidth()
                .testTag("community_search_input"),
            shape = RoundedCornerShape(12.dp),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Toggle: All Speakers vs Friends Only
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = { showOnlyFriends = false },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (!showOnlyFriends) BluePrimary else MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = if (!showOnlyFriends) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.weight(1f)
            ) {
                Text("All Speakers", fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = { showOnlyFriends = true },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (showOnlyFriends) BluePrimary else MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = if (showOnlyFriends) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.weight(1f)
            ) {
                Text("My Friends (${friendsList.size})", fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Community Directory list
        if (filteredList.isEmpty()) {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = null,
                    modifier = Modifier.size(64.dp),
                    tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    "No speaking peers found.",
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                )
                Text(
                    "Try checking your spelling or search by different interests like Tech or Cooking.",
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp)
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(filteredList) { peer ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectUser(peer) }
                            .testTag("community_user_card_${peer.id}"),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(contentAlignment = Alignment.BottomEnd) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(Brush.linearGradient(colors = listOf(GradientStart, GradientEnd))),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = peer.name.take(2).uppercase(),
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(if (peer.isOnline) SuccessGreen else Color.Gray)
                                )
                            }

                            Spacer(modifier = Modifier.width(16.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = peer.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text(
                                    text = "From ${peer.country} • Native: ${peer.nativeLanguage}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                                Box(
                                    modifier = Modifier
                                        .padding(top = 4.dp)
                                        .background(
                                            MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                                            RoundedCornerShape(6.dp)
                                        )
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = peer.englishLevel,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }

                            Row {
                                val isFriend = friendsList.any { it.id == peer.id }
                                IconButton(onClick = { onToggleFriend(peer.id) }) {
                                    Icon(
                                        imageVector = if (isFriend) Icons.Default.PersonRemove else Icons.Default.PersonAdd,
                                        contentDescription = "Toggle Friend",
                                        tint = if (isFriend) ErrorRed else BluePrimary
                                    )
                                }
                                IconButton(onClick = { onSelectUser(peer) }) {
                                    Icon(Icons.Default.Forum, contentDescription = "Chat", tint = BluePrimary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
