package com.tilawatak.ui.submit

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Audiotrack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tilawatak.domain.model.Gender
import com.tilawatak.domain.model.RecitationSubmission
import com.tilawatak.domain.model.SubmissionStatus
import com.tilawatak.ui.theme.BorderColor
import com.tilawatak.ui.theme.DeepGreen
import com.tilawatak.ui.theme.ErrorRed
import com.tilawatak.ui.theme.Gold
import com.tilawatak.ui.theme.LightGray
import com.tilawatak.ui.theme.PrimaryGreen
import com.tilawatak.ui.theme.SoftGray
import com.tilawatak.ui.theme.SurfaceWhite

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmitRecitationScreen(
    viewModel: SubmissionViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "انشر تلاوتك",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = DeepGreen
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "رجوع",
                            tint = DeepGreen
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceWhite)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (uiState.currentStep) {
                SubmissionStep.GUIDELINES -> {
                    GuidelinesView(
                        onStartClick = { viewModel.startSubmissionForm() },
                        userSubmissions = uiState.userSubmissions
                    )
                }
                SubmissionStep.FORM -> {
                    SubmissionFormView(
                        viewModel = viewModel,
                        uiState = uiState
                    )
                }
                SubmissionStep.SUCCESS -> {
                    SubmissionSuccessView(
                        onDoneClick = { viewModel.resetToGuidelines() }
                    )
                }
            }
        }
    }
}

/**
 * 1. Requirements and Guidelines Screen
 */
@Composable
fun GuidelinesView(
    onStartClick: () -> Unit,
    userSubmissions: List<RecitationSubmission>
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Hero Icon
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(PrimaryGreen.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Mic,
                contentDescription = null,
                tint = PrimaryGreen,
                modifier = Modifier.size(36.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "شارك تلاوتك مع العالم",
            style = MaterialTheme.typography.displayMedium.copy(
                fontWeight = FontWeight.Bold,
                color = DeepGreen
            ),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "أرسل تلاوتك للمراجعة، وبعد اعتمادها من الإدارة ستظهر داخل التطبيق.",
            style = MaterialTheme.typography.bodyLarge,
            color = SoftGray,
            textAlign = TextAlign.Center,
            lineHeight = 24.sp
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Requirements List Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = SurfaceWhite,
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
            shadowElevation = 1.dp
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "شروط وضوابط النشر:",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = DeepGreen
                    )
                )

                Spacer(modifier = Modifier.height(14.dp))

                val requirements = listOf(
                    "التلاوة للقرآن الكريم.",
                    "التسجيل واضح ونقي.",
                    "التسجيل من صاحب الطلب.",
                    "سيتم مراجعة التلاوة قبل نشرها.",
                    "يمكن استخدام اسم مستعار.",
                    "لا تعرض معلوماتك الشخصية للعامة دون موافقتك."
                )

                requirements.forEach { item ->
                    Row(
                        modifier = Modifier.padding(vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(22.dp)
                                .clip(CircleShape)
                                .background(PrimaryGreen.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Check,
                                contentDescription = null,
                                tint = PrimaryGreen,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = item,
                            style = MaterialTheme.typography.bodyMedium,
                            color = DeepGreen
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Start button
        Button(
            onClick = onStartClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen)
        ) {
            Text(
                text = "ابدأ إرسال تلاوتك",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = SurfaceWhite
                )
            )
        }

        // Previous User Submissions Tracker
        if (userSubmissions.isNotEmpty()) {
            Spacer(modifier = Modifier.height(28.dp))
            Text(
                text = "طلباتك السابقة قيد المراجعة",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = DeepGreen
                ),
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(10.dp))

            userSubmissions.forEach { sub ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = SurfaceWhite,
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "سورة ${sub.surahName} (${sub.ayahRange})",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = DeepGreen
                            )
                            Text(
                                text = sub.adminNotes ?: "قيد المراجعة",
                                style = MaterialTheme.typography.labelSmall,
                                color = SoftGray
                            )
                        }
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = when (sub.status) {
                                SubmissionStatus.APPROVED -> PrimaryGreen.copy(alpha = 0.15f)
                                SubmissionStatus.PENDING -> Gold.copy(alpha = 0.15f)
                                SubmissionStatus.REJECTED -> ErrorRed.copy(alpha = 0.15f)
                            }
                        ) {
                            Text(
                                text = when (sub.status) {
                                    SubmissionStatus.APPROVED -> "معتمدة"
                                    SubmissionStatus.PENDING -> "قيد المراجعة"
                                    SubmissionStatus.REJECTED -> "مرفوضة"
                                },
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = when (sub.status) {
                                    SubmissionStatus.APPROVED -> PrimaryGreen
                                    SubmissionStatus.PENDING -> DeepGreen
                                    SubmissionStatus.REJECTED -> ErrorRed
                                },
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * 2. Submission Form View (11 Fields + Validations)
 */
@Composable
fun SubmissionFormView(
    viewModel: SubmissionViewModel,
    uiState: SubmissionUiState
) {
    val form = uiState.formState
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Validation Error Banner
        if (form.validationError != null) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                color = ErrorRed.copy(alpha = 0.1f),
                border = androidx.compose.foundation.BorderStroke(1.dp, ErrorRed.copy(alpha = 0.3f))
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Info,
                        contentDescription = null,
                        tint = ErrorRed,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = form.validationError,
                        style = MaterialTheme.typography.bodyMedium,
                        color = ErrorRed
                    )
                }
            }
        }

        // 1. Display Name
        FormFieldLabel(title = "الاسم المعروض *", subtitle = "الاسم الحقيقي أو العام الذي سيعتمد في السجلات")
        OutlinedTextField(
            value = form.displayName,
            onValueChange = { viewModel.updateDisplayName(it) },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("مثال: عبد الرحمن بن أحمد") },
            shape = RoundedCornerShape(10.dp),
            colors = formFieldColors(),
            singleLine = true
        )

        // 2. Use Pseudonym Toggle & Field
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceWhite, RoundedCornerShape(10.dp))
                .border(1.dp, BorderColor, RoundedCornerShape(10.dp))
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "استخدام اسم مستعار",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = DeepGreen
                )
                Text(
                    text = "إخفاء اسمك الحقيقي وإظهار اللقب للمستمعين",
                    style = MaterialTheme.typography.labelSmall,
                    color = SoftGray
                )
            }
            Switch(
                checked = form.usePseudonym,
                onCheckedChange = { viewModel.toggleUsePseudonym(it) },
                colors = SwitchDefaults.colors(
                    checkedThumbColor = SurfaceWhite,
                    checkedTrackColor = PrimaryGreen
                )
            )
        }

        if (form.usePseudonym) {
            FormFieldLabel(title = "الاسم المستعار", subtitle = "الاسم الذي سيظهر للجمهور بدلاً من اسمك الحقيقي")
            OutlinedTextField(
                value = form.pseudonym,
                onValueChange = { viewModel.updatePseudonym(it) },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("مثال: صوت الأندلس") },
                shape = RoundedCornerShape(10.dp),
                colors = formFieldColors(),
                singleLine = true
            )
        }

        // 3. Gender
        FormFieldLabel(title = "الجنس", subtitle = "لتصنيف التسجيل وحفظ الخصوصية")
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            GenderRadioOption(
                label = "ذكر",
                selected = form.gender == Gender.MALE,
                onSelect = { viewModel.updateGender(Gender.MALE) },
                modifier = Modifier.weight(1f)
            )
            GenderRadioOption(
                label = "أنثى",
                selected = form.gender == Gender.FEMALE,
                onSelect = { viewModel.updateGender(Gender.FEMALE) },
                modifier = Modifier.weight(1f)
            )
        }

        // 4. Country
        FormFieldLabel(title = "الدولة", subtitle = "البلد الذي تقيم فيه أو تنتمي إليه")
        OutlinedTextField(
            value = form.country,
            onValueChange = { viewModel.updateCountry(it) },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("مثال: المملكة المغربية") },
            shape = RoundedCornerShape(10.dp),
            colors = formFieldColors(),
            singleLine = true
        )

        // 5. Surah Name
        FormFieldLabel(title = "السورة المقروءة *", subtitle = "اسم السورة المسجلة")
        OutlinedTextField(
            value = form.surahName,
            onValueChange = { viewModel.updateSurah(1, it) },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("مثال: الفاتحة، الكهف، مريم") },
            shape = RoundedCornerShape(10.dp),
            colors = formFieldColors(),
            singleLine = true
        )

        // 6. Ayah Range
        FormFieldLabel(title = "نطاق الآيات", subtitle = "مثال: كاملة، أو الآيات 1-20")
        OutlinedTextField(
            value = form.ayahRange,
            onValueChange = { viewModel.updateAyahRange(it) },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("مثال: كاملة (1-7)") },
            shape = RoundedCornerShape(10.dp),
            colors = formFieldColors(),
            singleLine = true
        )

        // 7. Riwayah
        FormFieldLabel(title = "الرواية القرآنية", subtitle = "الرواية التي تقرأ بها")
        val riwayahs = listOf("حفص عن عاصم", "ورش عن نافع", "قالون عن نافع", "الدوري عن أبي عمرو", "شعبة عن عاصم")
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            riwayahs.take(3).forEach { r ->
                val isSelected = form.riwayah == r
                FilterChip(
                    selected = isSelected,
                    onClick = { viewModel.updateRiwayah(r) },
                    label = { Text(r, fontSize = 12.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = PrimaryGreen,
                        selectedLabelColor = SurfaceWhite
                    )
                )
            }
        }

        // 8. Description / Notes
        FormFieldLabel(title = "وصف مختصر / نبذة", subtitle = "معلومات عن التلاوة أو إجازاتك القرآنية إن وجدت")
        OutlinedTextField(
            value = form.description,
            onValueChange = { viewModel.updateDescription(it) },
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp),
            placeholder = { Text("اكتب نبذة أو ملاحظات حول التسجيل...") },
            shape = RoundedCornerShape(10.dp),
            colors = formFieldColors(),
            maxLines = 4
        )

        // 9. Audio File Selector
        FormFieldLabel(title = "ملف الصوت *", subtitle = "صيغة MP3 أو M4A واضحة ونقية")
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .border(
                    1.dp,
                    if (form.audioFileName != null) PrimaryGreen else BorderColor,
                    RoundedCornerShape(12.dp)
                )
                .clickable {
                    // Simulated audio picker
                    viewModel.selectAudioFile("quran_recitation_${System.currentTimeMillis()}.mp3", 185)
                },
            color = if (form.audioFileName != null) PrimaryGreen.copy(alpha = 0.05f) else SurfaceWhite
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = if (form.audioFileName != null) Icons.Default.Audiotrack else Icons.Default.CloudUpload,
                    contentDescription = null,
                    tint = if (form.audioFileName != null) PrimaryGreen else SoftGray,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = form.audioFileName ?: "اضغط لاختيار ملف الصوت من جهازك",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = if (form.audioFileName != null) FontWeight.Bold else FontWeight.Normal
                        ),
                        color = if (form.audioFileName != null) DeepGreen else SoftGray
                    )
                    if (form.audioFileName != null) {
                        Text(
                            text = "تم اختيار الملف بنجاح (جاهز للرفع)",
                            style = MaterialTheme.typography.labelSmall,
                            color = PrimaryGreen
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Submit Button
        Button(
            onClick = { viewModel.submitRecitation() },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
            enabled = !uiState.isSubmitting
        ) {
            if (uiState.isSubmitting) {
                CircularProgressIndicator(
                    color = SurfaceWhite,
                    strokeWidth = 2.dp,
                    modifier = Modifier.size(24.dp)
                )
            } else {
                Text(
                    text = "إرسال للمراجعة",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = SurfaceWhite
                    )
                )
            }
        }
    }
}

/**
 * 3. Submission Success View
 */
@Composable
fun SubmissionSuccessView(onDoneClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
                .background(PrimaryGreen.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                tint = PrimaryGreen,
                modifier = Modifier.size(48.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "تم إرسال تلاوتك بنجاح",
            style = MaterialTheme.typography.displayMedium.copy(
                fontWeight = FontWeight.Bold,
                color = DeepGreen
            ),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "ستتم مراجعتها من الإدارة وتدقيقها صوتيًا وتجويديًا قبل نشرها داخل التطبيق.",
            style = MaterialTheme.typography.bodyLarge,
            color = SoftGray,
            textAlign = TextAlign.Center,
            lineHeight = 24.sp
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onDoneClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen)
        ) {
            Text(
                text = "العودة إلى الرئيسية",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = SurfaceWhite
                )
            )
        }
    }
}

@Composable
private fun FormFieldLabel(title: String, subtitle: String? = null) {
    Column(modifier = Modifier.padding(top = 4.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
            color = DeepGreen
        )
        if (subtitle != null) {
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = SoftGray
            )
        }
    }
}

@Composable
private fun GenderRadioOption(
    label: String,
    selected: Boolean,
    onSelect: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .border(
                1.dp,
                if (selected) PrimaryGreen else BorderColor,
                RoundedCornerShape(10.dp)
            )
            .clickable(onClick = onSelect),
        color = if (selected) PrimaryGreen.copy(alpha = 0.08f) else SurfaceWhite
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            RadioButton(
                selected = selected,
                onClick = onSelect,
                colors = RadioButtonDefaults.colors(selectedColor = PrimaryGreen)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                color = DeepGreen
            )
        }
    }
}

@Composable
private fun formFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = PrimaryGreen,
    unfocusedBorderColor = BorderColor,
    focusedContainerColor = SurfaceWhite,
    unfocusedContainerColor = SurfaceWhite
)
