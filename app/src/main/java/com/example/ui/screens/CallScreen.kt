package com.example.ui.screens

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.User
import com.example.ui.theme.DarkBackground
import com.example.ui.theme.DarkSurface
import com.example.ui.theme.ErrorRed
import com.example.ui.theme.GradientEnd
import com.example.ui.theme.GradientMiddle
import com.example.ui.theme.GradientStart
import com.example.ui.theme.SuccessGreen
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CallScreen(
    user: User,
    isVideo: Boolean,
    durationSeconds: Int,
    onEndCall: () -> Unit,
    modifier: Modifier = Modifier
) {
    // --- RUNTIME PERMISSIONS GATHERING ---
    val permissionsToRequest = if (isVideo) {
        listOf(
            android.Manifest.permission.CAMERA,
            android.Manifest.permission.RECORD_AUDIO
        )
    } else {
        listOf(
            android.Manifest.permission.RECORD_AUDIO
        )
    }

    val permissionState = rememberMultiplePermissionsState(permissions = permissionsToRequest)

    // Trigger permission dialog automatically on active call entry
    LaunchedEffect(Unit) {
        permissionState.launchMultiplePermissionRequest()
    }

    if (!permissionState.allPermissionsGranted) {
        // Render beautiful Permission Rationale Screen inside the overlay
        Column(
            modifier = modifier
                .fillMaxSize()
                .background(DarkBackground)
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF38BDF8).copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isVideo) Icons.Default.Videocam else Icons.Default.Mic,
                    contentDescription = "Permission Needed Icon",
                    tint = Color(0xFF38BDF8),
                    modifier = Modifier.size(48.dp)
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = "Hardware Access Required",
                style = MaterialTheme.typography.titleLarge,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = if (isVideo) {
                    "To enter active video circles and speak English with global partners, we require microphone and camera permissions."
                } else {
                    "To speak English and make 1-on-1 voice exchanges with peer partners, we require microphone access."
                },
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.7f),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
            Spacer(modifier = Modifier.height(32.dp))
            Button(
                onClick = { permissionState.launchMultiplePermissionRequest() },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284c7)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                Text(
                    text = "Grant Call Permissions",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = onEndCall,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                Text(
                    text = "Decline & Exit Call",
                    color = ErrorRed,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 15.sp
                )
            }
        }
        return
    }

    var isMuted by remember { mutableStateOf(false) }
    var isCamOff by remember { mutableStateOf(false) }
    var isSpeakerOn by remember { mutableStateOf(true) }

    val formattedTime = remember(durationSeconds) {
        val mins = durationSeconds / 60
        val secs = durationSeconds % 60
        String.format("%02d:%02d", mins, secs)
    }

    // Ripple / Pulse Animations for Voice Waveforms
    val infiniteTransition = rememberInfiniteTransition(label = "pulse_transition")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // --- Top Row: Call info ---
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = if (isVideo) "Interactive Video Practice" else "1-on-1 Voice Session",
                style = MaterialTheme.typography.titleMedium,
                color = SuccessGreen,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Text(
                text = formattedTime,
                style = MaterialTheme.typography.headlineMedium,
                color = Color.White,
                fontWeight = FontWeight.ExtraBold,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        // --- Middle Viewport: Video feeds or Voice waveform pulses ---
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(vertical = 32.dp),
            contentAlignment = Alignment.Center
        ) {
            if (isVideo && !isCamOff) {
                // --- VIDEO CALL GRID ---
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Partner's Big Video (Simulated Feed)
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkSurface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        colors = listOf(Color(0xFF1E293B), Color(0xFF0F172A))
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(
                                    modifier = Modifier
                                        .size(80.dp)
                                        .clip(CircleShape)
                                        .background(Brush.linearGradient(colors = listOf(GradientStart, GradientEnd))),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = user.name.take(2).uppercase(),
                                        style = MaterialTheme.typography.headlineMedium,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "${user.name} (English Peer)",
                                    color = Color.White,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "Level: ${user.englishLevel}",
                                    color = Color.White.copy(alpha = 0.6f),
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }

                            // Pulsing "Streaming Live" Indicator
                            Row(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(16.dp)
                                    .background(Color.Red, RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(Color.White)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("LIVE", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // My Small PiP Video (Simulated)
                    Card(
                        modifier = Modifier
                            .height(140.dp)
                            .width(200.dp)
                            .align(Alignment.End),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkSurface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color(0xFF334155)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(32.dp))
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("My Camera Feed", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            } else {
                // --- VOICE CALL LAYOUT (Pulsing Circle Waveform) ---
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    // Outer Waveform Ripple 2
                    Box(
                        modifier = Modifier
                            .size(180.dp)
                            .graphicsLayer(scaleX = pulseScale, scaleY = pulseScale)
                            .clip(CircleShape)
                            .background(Color(0xFF0EA5E9).copy(alpha = 0.15f))
                    )
                    // Outer Waveform Ripple 1
                    Box(
                        modifier = Modifier
                            .size(140.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF38BDF8).copy(alpha = 0.25f))
                    )
                    // Core Avatar Circle
                    Box(
                        modifier = Modifier
                            .size(100.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.radialGradient(
                                    colors = listOf(GradientStart, GradientMiddle, GradientEnd)
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = user.name.take(2).uppercase(),
                            style = MaterialTheme.typography.headlineMedium,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = user.name,
                            style = MaterialTheme.typography.titleLarge,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Practicing from ${user.country}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White.copy(alpha = 0.6f)
                        )
                    }
                }
            }
        }

        // --- Bottom Row: Call Controller HUD panel ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Mute mic toggle button
                IconButton(
                    onClick = { isMuted = !isMuted },
                    modifier = Modifier
                        .size(52.dp)
                        .testTag("call_mute_mic_button"),
                    colors = IconButtonDefaults.iconButtonColors(
                        containerColor = if (isMuted) ErrorRed else Color.White.copy(alpha = 0.1f)
                    )
                ) {
                    Icon(
                        imageVector = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                        contentDescription = "Mute Microphone",
                        tint = if (isMuted) Color.White else Color.White
                    )
                }

                // Speaker phone toggle button
                IconButton(
                    onClick = { isSpeakerOn = !isSpeakerOn },
                    modifier = Modifier.size(52.dp),
                    colors = IconButtonDefaults.iconButtonColors(
                        containerColor = if (isSpeakerOn) SuccessGreen else Color.White.copy(alpha = 0.1f)
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.VolumeUp,
                        contentDescription = "Speakerphone",
                        tint = Color.White
                    )
                }

                if (isVideo) {
                    // Video Camera Feed Toggle
                    IconButton(
                        onClick = { isCamOff = !isCamOff },
                        modifier = Modifier.size(52.dp),
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = if (isCamOff) ErrorRed else Color.White.copy(alpha = 0.1f)
                        )
                    ) {
                        Icon(
                            imageVector = if (isCamOff) Icons.Default.VideocamOff else Icons.Default.Videocam,
                            contentDescription = "Toggle Video",
                            tint = Color.White
                        )
                    }
                }

                // End Call Action
                IconButton(
                    onClick = onEndCall,
                    modifier = Modifier
                        .size(56.dp)
                        .testTag("call_end_button"),
                    colors = IconButtonDefaults.iconButtonColors(
                        containerColor = ErrorRed
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.CallEnd,
                        contentDescription = "End Practice Session",
                        tint = Color.White,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
        }
    }
}
