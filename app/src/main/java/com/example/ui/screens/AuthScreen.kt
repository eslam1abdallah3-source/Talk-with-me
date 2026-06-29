package com.example.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.ui.theme.BluePrimary

@OptIn(ExperimentalAnimationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    onLoginSuccess: (String) -> Unit,
    onRegisterSuccess: (String, String, String, String, String) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableStateOf(0) } // 0 = Login, 1 = Register

    // Input States
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var country by remember { mutableStateOf("United States") }
    var nativeLanguage by remember { mutableStateOf("Spanish") }
    var englishLevel by remember { mutableStateOf("Intermediate") }

    val levels = listOf("Beginner", "Intermediate", "Advanced", "Native")
    var levelExpanded by remember { mutableStateOf(false) }

    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(scrollState)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(modifier = Modifier.height(24.dp))

        // --- Logo and Header ---
        Image(
            painter = painterResource(id = R.drawable.img_app_icon),
            contentDescription = "English Circle Logo",
            modifier = Modifier
                .size(96.dp)
                .clip(CircleShape)
                .background(Color.White)
                .padding(8.dp),
            contentScale = ContentScale.Fit
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "English Circle",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.primary,
            textAlign = TextAlign.Center
        )

        Text(
            text = "Join our global speaking circle",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
        )

        // --- Card Container for TabRow and Inputs ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("auth_form_card"),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color.Transparent,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Log In", fontWeight = FontWeight.Bold, fontSize = 16.sp) }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Register", fontWeight = FontWeight.Bold, fontSize = 16.sp) }
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                AnimatedContent(
                    targetState = selectedTab,
                    label = "tab_animation"
                ) { tab ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        if (tab == 0) {
                            // --- LOGIN TAB ---
                            OutlinedTextField(
                                value = email,
                                onValueChange = { email = it },
                                label = { Text("Email Address") },
                                leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("login_email_input"),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                shape = RoundedCornerShape(12.dp)
                            )

                            OutlinedTextField(
                                value = password,
                                onValueChange = { password = it },
                                label = { Text("Password") },
                                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                                visualTransformation = PasswordVisualTransformation(),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("login_password_input"),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                                shape = RoundedCornerShape(12.dp)
                            )

                            Button(
                                onClick = { if (email.isNotBlank()) onLoginSuccess(email) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp)
                                    .testTag("submit_login_button"),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = BluePrimary)
                            ) {
                                Text("Log In", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }

                            // --- Simulated Google Login ---
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Spacer(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(1.dp)
                                        .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f))
                                )
                                Text(
                                    text = " OR ",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )
                                Spacer(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(1.dp)
                                        .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f))
                                )
                            }

                            OutlinedButton(
                                onClick = { onLoginSuccess("google.user@gmail.com") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp)
                                    .testTag("google_login_button"),
                                shape = RoundedCornerShape(12.dp),
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(
                                        painter = painterResource(id = android.R.drawable.ic_menu_compass), // Simple indicator
                                        contentDescription = "Google Logo",
                                        modifier = Modifier.size(20.dp),
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text("Continue with Google", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                                }
                            }
                        } else {
                            // --- REGISTER TAB ---
                            OutlinedTextField(
                                value = name,
                                onValueChange = { name = it },
                                label = { Text("Full Name") },
                                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("register_name_input"),
                                shape = RoundedCornerShape(12.dp)
                            )

                            OutlinedTextField(
                                value = email,
                                onValueChange = { email = it },
                                label = { Text("Email Address") },
                                leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("register_email_input"),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                shape = RoundedCornerShape(12.dp)
                            )

                            OutlinedTextField(
                                value = country,
                                onValueChange = { country = it },
                                label = { Text("Country of Residence") },
                                leadingIcon = { Icon(Icons.Default.Public, contentDescription = null) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("register_country_input"),
                                shape = RoundedCornerShape(12.dp)
                            )

                            OutlinedTextField(
                                value = nativeLanguage,
                                onValueChange = { nativeLanguage = it },
                                label = { Text("Native Language") },
                                leadingIcon = { Icon(Icons.Default.Translate, contentDescription = null) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("register_language_input"),
                                shape = RoundedCornerShape(12.dp)
                            )

                            // Exposed Dropdown for English Level
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
                                        .testTag("register_level_dropdown"),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                ExposedDropdownMenu(
                                    expanded = levelExpanded,
                                    onDismissRequest = { levelExpanded = false }
                                ) {
                                    levels.forEach { level ->
                                        DropdownMenuItem(
                                            text = { Text(level) },
                                            onClick = {
                                                englishLevel = level
                                                levelExpanded = false
                                            }
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Button(
                                onClick = {
                                    if (name.isNotBlank() && email.isNotBlank()) {
                                        onRegisterSuccess(name, email, country, nativeLanguage, englishLevel)
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp)
                                    .testTag("submit_register_button"),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = BluePrimary)
                            ) {
                                Text("Create Account", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
