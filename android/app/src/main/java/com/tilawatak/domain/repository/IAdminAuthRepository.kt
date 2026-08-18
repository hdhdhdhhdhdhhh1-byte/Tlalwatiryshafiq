package com.tilawatak.domain.repository

import com.tilawatak.domain.model.AdminProfile

/**
 * Authentication abstraction for owner/admin access.
 * Public users NEVER access or see this interface.
 */
interface IAdminAuthRepository {
    suspend fun signInWithEmail(email: String, password: String): Result<AdminProfile>
    suspend fun signOut(): Result<Unit>
    suspend fun getCurrentAdmin(): Result<AdminProfile?>
    fun isAuthenticated(): Boolean
}
