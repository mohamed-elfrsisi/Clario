import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/context'

export function useDashboardData() {
  const { user } = useAuth()
  const [data, setData] = useState({
    documentsCount: 0,
    opportunitiesCount: 0,
    analysesCount: 0,
    recentAnalyses: [] as any[],
    recentDocuments: [] as any[],
    recentOpportunities: [] as any[],
    loading: true,
  })

  useEffect(() => {
    if (!user) {
      setData((d) => ({ ...d, loading: false }))
      return
    }

    async function fetchData() {
      try {
        const [docsRes, oppsRes] = await Promise.all([
          api.listDocuments(0, 5),
          api.listOpportunities(0, 5),
        ])

        setData({
          documentsCount: docsRes.data.length,
          opportunitiesCount: oppsRes.data.length,
          analysesCount: 0,
          recentDocuments: docsRes.data,
          recentOpportunities: oppsRes.data,
          recentAnalyses: [],
          loading: false,
        })
      } catch {
        setData((d) => ({ ...d, loading: false }))
      }
    }

    fetchData()
  }, [user])

  return data
}

export function useLoading(initial = false) {
  const [loading, setLoading] = useState(initial)
  const start = () => setLoading(true)
  const stop = () => setLoading(false)
  return { loading, start, stop }
}
