package com.tilawatak.data.repository

import com.tilawatak.data.mock.MockData
import com.tilawatak.domain.model.ReciterHonor
import com.tilawatak.domain.model.RewardDefinition
import com.tilawatak.domain.repository.IRewardRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

class MockRewardRepository : IRewardRepository {

    private val _rewardsFlow = MutableStateFlow<List<RewardDefinition>>(MockData.REWARDS)
    private val _honorsFlow = MutableStateFlow<List<ReciterHonor>>(MockData.RECITER_HONORS)

    override suspend fun getAllRewards(): Result<List<RewardDefinition>> {
        return Result.success(_rewardsFlow.value)
    }

    override suspend fun getHonorsByReciter(reciterId: String): Result<List<ReciterHonor>> {
        val honors = _honorsFlow.value.filter { it.reciterId == reciterId }
        return Result.success(honors)
    }

    override fun getReciterHonorsStream(reciterId: String): Flow<List<ReciterHonor>> {
        return _honorsFlow.map { list -> list.filter { it.reciterId == reciterId } }
    }
}
