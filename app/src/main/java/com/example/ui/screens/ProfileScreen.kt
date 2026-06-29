package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.User
import com.example.ui.theme.GradientEnd
import com.example.ui.theme.GradientMiddle
import com.example.ui.theme.GradientStart
import com.example.ui.theme.BluePrimary

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun ProfileScreen(
    user: User,
    onSaveProfile: (User) -> Unit,
    modifier: Modifier = Modifier
) {
    var name by remember { mutableStateOf(user.name) }
    var country by remember { mutableStateOf(user.country) }
    var nativeLanguage by remember { mutableStateOf(user.nativeLanguage) }
    var englishLevel by remember { mutableStateOf(user.englishLevel) }
    var selectedInterests by remember { mutableStateOf(user.interests.toSet()) }
    var selectedAvatarColorIndex by remember { mutableStateOf(0) }

    val levels = listOf("Beginner", "Intermediate", "Advanced", "Native")
    var levelExpanded by remember { mutableStateOf(false) }

    val interestOptions = listOf(
        "Music", "Travel", "Tech", "Gaming", "Literature", "Art",
        "Movies", "Football", "Cooking", "Hiking", "Anime", "History", "Business"
    )

    // Avatar Colors Configuration
    val avatarColors = listOf(
        Brush.linearGradient(colors = listOf(GradientStart, GradientEnd)),
        Brush.linearGradient(colors = listOf(Color(0xFFF12711), Color(0xFFF5AF19))),
        Brush.linearGradient(colors = listOf(Color(0xFF11998e), Color(0xFF38ef7d))),
        Brush.linearGradient(colors = listOf(Color(0xFF8e2de2), Color(0xFF4a00e0))),
        Brush.linearGradient(colors = listOf(Color(0xFFfc00ff), Color(0xFF00dbde))),
        Brush.linearGradient(colors = listOf(Color(0xFF0575E6), Color(0xFF00F260)))
    )

    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(scrollState)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // --- Header Title ---
        Text(
            text = "My Speaking Profile",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 24.dp)
        )

        // --- Avatar Selection Area ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Select Avatar Theme",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                // Large Display Avatar
                Box(
                    modifier = Modifier
                        .size(96.dp)
                        .clip(CircleShape)
                        .background(avatarColors[selectedAvatarColorIndex]),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (name.isNotBlank()) name.take(2).uppercase() else "EC",
                        style = MaterialTheme.typography.headlineLarge,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Avatar Theme Row selector
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    avatarColors.forEachIndexed { index, brush ->
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(brush)
                                .clickable { selectedAvatarColorIndex = index }
                                .testTag("avatar_color_$index"),
                            contentAlignment = Alignment.Center
                        ) {
                            if (selectedAvatarColorIndex == index) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = "Selected",
                                    tint = Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // --- Core Details Fields ---
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Personal Details",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 4.dp)
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Display Name") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("profile_name_input"),
                    shape = RoundedCornerShape(12.dp)
                )

                OutlinedTextField(
                    value = country,
                    onValueChange = { country = it },
                    label = { Text("Country of Residence") },
                    leadingIcon = { Icon(Icons.Default.Public, contentDescription = null) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("profile_country_input"),
                    shape = RoundedCornerShape(12.dp)
                )

                OutlinedTextField(
                    value = nativeLanguage,
                    onValueChange = { nativeLanguage = it },
                    label = { Text("Native Language") },
                    leadingIcon = { Icon(Icons.Default.Translate, contentDescription = null) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("profile_language_input"),
                    shape = RoundedCornerShape(12.dp)
                )

                // Proficient Level dropdown
                ExposedDropdownMenuBox(
                    expanded = levelExpanded,
                    onExpandedChange = { levelExpanded = !levelExpanded },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = englishLevel,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("English Proficiency Level") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = levelExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                            .testTag("profile_level_dropdown"),
                        shape = RoundedCornerShape(12.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = levelExpanded,
                        onDismissRequest = { levelExpanded = false }
                    ) {
                        levels.forEach { lvl ->
                            DropdownMenuItem(
                                text = { Text(lvl) },
                                onClick = {
                                    englishLevel = lvl
                                    levelExpanded = false
                                }
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // --- Interests Selection ---
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text(
                    text = "Conversation Interests",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Text(
                    text = "We match you with speakers who share similar interests. Select at least 3 for optimal matching.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    interestOptions.forEach { interest ->
                        val isSelected = selectedInterests.contains(interest)
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                selectedInterests = if (isSelected) {
                                    selectedInterests - interest
                                } else {
                                    selectedInterests + interest
                                }
                            },
                            label = { Text(interest, fontSize = 13.sp) },
                            leadingIcon = if (isSelected) {
                                {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            } else null,
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                                selectedLabelColor = MaterialTheme.colorScheme.primary,
                                selectedLeadingIconColor = MaterialTheme.colorScheme.primary
                            ),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.testTag("interest_chip_$interest")
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // --- Save Changes Button ---
        Button(
            onClick = {
                if (name.isNotBlank()) {
                    val updatedUser = user.copy(
                        name = name,
                        country = country,
                        nativeLanguage = nativeLanguage,
                        englishLevel = englishLevel,
                        interests = selectedInterests.toList()
                    )
                    onSaveProfile(updatedUser)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .testTag("save_profile_button"),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = BluePrimary)
        ) {
            Icon(Icons.Default.Save, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Save & Apply Changes", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(48.dp))
    }
}
