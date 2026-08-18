package com.tilawatak.data.repository

import com.tilawatak.domain.model.AdminProfile
import com.tilawatak.domain.model.AdminRole
import com.tilawatak.domain.repository.IAdminAuthRepository
import kotlinx.coroutines.flow.MutableStateFlow

class MockAdminAuthRepository : IAdminAuthRepository {

    private val currentAdmin = MutableStateFlow<AdminProfile?>(null)

    override suspend fun signInWithEmail(email: String, password: String): Result<AdminProfile> {
        val admin = AdminProfile(
            id = "admin-1",
            email = email,
            fullName = "مدير المنصة",
            role = AdminRole.SUPER_ADMIN,
            isActive = true
        )
        currentAdmin.value = admin
        return Result.success(admin)
    }

    override suspend fun signOut(): Result<Unit> {
        currentAdmin.value = null
        return Result.success(Unit)
    }

    override suspend fun getCurrentAdmin(): Result<AdminProfile?> {
        return Result.success(currentAdmin.value)
    }

    override fun isAuthenticated(): Boolean {
        return currentAdmin.value != null
    }
}
