package com.tilawatak.domain.repository

import com.tilawatak.domain.model.ReciterHonor
import com.tilawatak.domain.model.RewardDefinition
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for non-financial achievements, badges, and honors.
 * STRICT RULE: No monetary rewards or financial transactions.
 */
interface IRewardRepository {
    suspend fun getAllRewards(): Result<List<RewardDefinition>>
    suspend fun getHonorsByReciter(reciterId: String): Result<List<ReciterHonor>>
    fun getReciterHonorsStream(reciterId: String): Flow<List<ReciterHonor>>
}
