import { ref } from 'vue'
import { defineStore } from 'pinia'

import { pipelines as initialPipelines } from '../data/pipelines'

const STORAGE_KEY = 'pipewise-registered-assets'

function clonePipeline(pipeline) {
  return {
    ...pipeline,
    coordinates: pipeline.coordinates.map((point) => [...point]),
  }
}

function loadPipelines() {
  try {
    const savedValue = window.localStorage.getItem(STORAGE_KEY)

    if (!savedValue) {
      return initialPipelines.map(clonePipeline)
    }

    const savedAssets = JSON.parse(savedValue)

    if (savedAssets?.version === 2 && Array.isArray(savedAssets.pipelines)) {
      return savedAssets.pipelines.map(clonePipeline)
    }

    if (Array.isArray(savedAssets)) {
      return [
        ...initialPipelines.map(clonePipeline),
        ...savedAssets.map(clonePipeline),
      ]
    }

    return initialPipelines.map(clonePipeline)
  } catch {
    return initialPipelines.map(clonePipeline)
  }
}

export const useAssetStore = defineStore('assetStore', () => {
  const pipelines = ref(loadPipelines())

  function persistPipelines() {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        pipelines: pipelines.value,
      }),
    )
  }

  function assetIdExists(assetId, excludedId = '') {
    const normalizedId = assetId.trim().toUpperCase()
    const normalizedExcludedId = excludedId.trim().toUpperCase()

    return pipelines.value.some(
      (pipeline) =>
        pipeline.id.toUpperCase() === normalizedId &&
        pipeline.id.toUpperCase() !== normalizedExcludedId,
    )
  }

  function registerAsset(asset) {
    const registeredAsset = clonePipeline({
      ...asset,
      id: asset.id.trim().toUpperCase(),
      name: asset.name.trim(),
      status: 'normal',
    })

    pipelines.value.push(registeredAsset)

    persistPipelines()

    return registeredAsset
  }

  function updateAsset(currentId, updates) {
    const assetIndex = pipelines.value.findIndex(
      (pipeline) => pipeline.id === currentId,
    )

    if (assetIndex === -1) {
      return null
    }

    const updatedAsset = clonePipeline({
      ...pipelines.value[assetIndex],
      ...updates,
      id: updates.id.trim().toUpperCase(),
      name: updates.name.trim(),
    })

    pipelines.value[assetIndex] = updatedAsset
    persistPipelines()

    return updatedAsset
  }

  function deleteAsset(assetId) {
    const assetIndex = pipelines.value.findIndex(
      (pipeline) => pipeline.id === assetId,
    )

    if (assetIndex === -1) {
      return false
    }

    pipelines.value.splice(assetIndex, 1)
    persistPipelines()

    return true
  }

  function setAssetStatus(assetId, status) {
    const asset = pipelines.value.find((pipeline) => pipeline.id === assetId)

    if (!asset) {
      return null
    }

    asset.status = status
    persistPipelines()
    return asset
  }

  return {
    pipelines,
    assetIdExists,
    registerAsset,
    updateAsset,
    deleteAsset,
    setAssetStatus,
  }
})
