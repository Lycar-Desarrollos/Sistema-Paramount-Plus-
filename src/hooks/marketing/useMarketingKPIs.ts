import { useMemo } from 'react';
import type { Campaign } from '../../types/marketing';

/**
 * Hook para calcular KPIs de Marketing en tiempo real
 */
export const useMarketingKPIs = (campaigns: Campaign[]) => {
  return useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.status === 'Activa');
    
    const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
    const totalSpent = campaigns.reduce((acc, c) => acc + (c.spent || 0), 0);
    const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue || 0), 0);
    
    const avgROI = totalSpent > 0 
      ? ((totalRevenue - totalSpent) / totalSpent) * 100 
      : 0;

    const budgetProgress = totalBudget > 0 
      ? (totalSpent / totalBudget) * 100 
      : 0;

    return {
      activeCount: activeCampaigns.length,
      totalBudget,
      totalSpent,
      totalRevenue,
      avgROI,
      budgetProgress,
      totalCampaigns: campaigns.length
    };
  }, [campaigns]);
};
