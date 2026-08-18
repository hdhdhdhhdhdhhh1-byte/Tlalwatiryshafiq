package com.tilawatak.ui.submit

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tilawatak.domain.model.Gender
import com.tilawatak.domain.model.RecitationSubmission
import com.tilawatak.domain.model.SubmissionStatus
import com.tilawatak.domain.repository.ISubmissionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SubmissionFormState(
    val displayName: String = "",
    val pseudonym: String = "",
    val usePseudonym: Boolean = false,
    val gender: Gender = Gender.MALE,
    val country: String = "المملكة العربية السعودية",
    val surahNumber: Int = 1,
    val surahName: String = "الفاتحة",
    val ayahRange: String = "كاملة (1-7)",
    val riwayah: String = "حفص عن عاصم",
    val description: String = "",
    val audioFileName: String? = null,
    val audioDurationSeconds: Long = 120,
    val validationError: String? = null
)

data class SubmissionUiState(
    val currentStep: SubmissionStep = SubmissionStep.GUIDELINES,
    val formState: SubmissionFormState = SubmissionFormState(),
    val isSubmitting: Boolean = false,
    val submissionSuccess: Boolean = false,
    val userSubmissions: List<RecitationSubmission> = emptyList(),
    val errorMessage: String? = null
)

enum class SubmissionStep {
    GUIDELINES,
    FORM,
    SUCCESS
}

class SubmissionViewModel(
    private val submissionRepository: ISubmissionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubmissionUiState())
    val uiState: StateFlow<SubmissionUiState> = _uiState.asStateFlow()

    init {
        observeSubmissions()
    }

    private fun observeSubmissions() {
        viewModelScope.launch {
            submissionRepository.getUserSubmissions().collect { list ->
                _uiState.update { it.copy(userSubmissions = list) }
            }
        }
    }

    fun startSubmissionForm() {
        _uiState.update { it.copy(currentStep = SubmissionStep.FORM) }
    }

    fun updateDisplayName(name: String) {
        _uiState.update { it.copy(formState = it.formState.copy(displayName = name, validationError = null)) }
    }

    fun updatePseudonym(pseudonym: String) {
        _uiState.update { it.copy(formState = it.formState.copy(pseudonym = pseudonym)) }
    }

    fun toggleUsePseudonym(use: Boolean) {
        _uiState.update { it.copy(formState = it.formState.copy(usePseudonym = use)) }
    }

    fun updateGender(gender: Gender) {
        _uiState.update { it.copy(formState = it.formState.copy(gender = gender)) }
    }

    fun updateCountry(country: String) {
        _uiState.update { it.copy(formState = it.formState.copy(country = country)) }
    }

    fun updateSurah(number: Int, name: String) {
        _uiState.update { it.copy(formState = it.formState.copy(surahNumber = number, surahName = name)) }
    }

    fun updateAyahRange(range: String) {
        _uiState.update { it.copy(formState = it.formState.copy(ayahRange = range)) }
    }

    fun updateRiwayah(riwayah: String) {
        _uiState.update { it.copy(formState = it.formState.copy(riwayah = riwayah)) }
    }

    fun updateDescription(desc: String) {
        _uiState.update { it.copy(formState = it.formState.copy(description = desc)) }
    }

    fun selectAudioFile(fileName: String, durationSeconds: Long) {
        _uiState.update {
            it.copy(
                formState = it.formState.copy(
                    audioFileName = fileName,
                    audioDurationSeconds = durationSeconds,
                    validationError = null
                )
            )
        }
    }

    fun submitRecitation() {
        val form = _uiState.value.formState

        // Arabic Validations
        if (form.displayName.isBlank()) {
            _uiState.update { it.copy(formState = it.formState.copy(validationError = "يرجى كتابة الاسم المعروض")) }
            return
        }

        if (form.surahName.isBlank()) {
            _uiState.update { it.copy(formState = it.formState.copy(validationError = "يرجى تحديد السورة المقروءة")) }
            return
        }

        if (form.audioFileName == null) {
            _uiState.update { it.copy(formState = it.formState.copy(validationError = "يرجى اختيار ملف الصوت للتلاوة")) }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, errorMessage = null) }
            val submission = RecitationSubmission(
                id = "",
                displayName = form.displayName,
                pseudonym = if (form.usePseudonym && form.pseudonym.isNotBlank()) form.pseudonym else null,
                usePseudonym = form.usePseudonym,
                gender = form.gender,
                country = form.country,
                surahNumber = form.surahNumber,
                surahName = form.surahName,
                ayahRange = form.ayahRange,
                riwayah = form.riwayah,
                description = form.description,
                audioUri = "mock://audio/${form.audioFileName}",
                audioDurationSeconds = form.audioDurationSeconds,
                status = SubmissionStatus.PENDING
            )

            val result = submissionRepository.submitRecitation(submission)
            result.onSuccess {
                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        submissionSuccess = true,
                        currentStep = SubmissionStep.SUCCESS,
                        formState = SubmissionFormState()
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        errorMessage = error.localizedMessage ?: "فشل إرسال التلاوة، يرجى المحاولة لاحقًا"
                    )
                }
            }
        }
    }

    fun resetToGuidelines() {
        _uiState.update {
            it.copy(
                currentStep = SubmissionStep.GUIDELINES,
                submissionSuccess = false,
                formState = SubmissionFormState()
            )
        }
    }
}
