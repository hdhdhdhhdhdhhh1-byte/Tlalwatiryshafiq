package com.tilawatak.domain.repository

import com.tilawatak.domain.model.LikeResult

/**
 * Repository interface specifically dedicated to managing anonymous likes.
 */
interface ILikeRepository {
    /**
     * Toggles the like state for a recitation given an installation ID.
     */
    suspend fun toggleLike(recitationId: String, installationId: String): Result<LikeResult>

    /**
     * Checks if a recitation is liked by the current installation.
     */
    suspend fun isLiked(recitationId: String, installationId: String): Result<Boolean>
}
