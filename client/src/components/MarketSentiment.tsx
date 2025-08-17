import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  DollarSign,
  Percent,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  MinusCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MarketSentiment {
  id: string;
  timestamp: string;
  overallMood: 'bullish' | 'bearish' | 'neutral';
  moodScore: number;
  indicators: Record<string, any>;
  housePrice?: number;
  interestRate?: number;
  inflationRate?: number;
  unemploymentRate?: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  dataSource: string;
  createdAt: string;
}

export default function MarketSentiment() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch latest market sentiment
  const { data: sentiment, isLoading } = useQuery<MarketSentiment>({
    queryKey: ['/api/market-sentiment/latest'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Refresh market sentiment mutation
  const refreshMutation = useMutation({
    mutationFn: () => apiRequest('/api/market-sentiment/refresh', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/market-sentiment/latest'] });
      setIsRefreshing(false);
    },
    onError: () => {
      setIsRefreshing(false);
    }
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshMutation.mutate();
  };

  // Auto-refresh on component mount
  useEffect(() => {
    if (!sentiment) {
      handleRefresh();
    }
  }, []);

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'bullish':
        return <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'bearish':
        return <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'bullish':
        return 'text-green-600 dark:text-green-400';
      case 'bearish':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getMoodBadgeVariant = (mood: string) => {
    switch (mood) {
      case 'bullish':
        return 'default'; // Green theme
      case 'bearish':
        return 'destructive'; // Red theme
      default:
        return 'secondary'; // Gray theme
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'negative':
        return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <MinusCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const formatBasisPoints = (bp: number) => {
    return `${(bp / 100).toFixed(2)}%`;
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString()}`;
  };

  if (isLoading && !sentiment) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Market Trend Mood</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Market Trend Mood</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || refreshMutation.isPending}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing || refreshMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sentiment ? (
          <>
            {/* Overall Mood Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getMoodIcon(sentiment.overallMood)}
                  <div>
                    <h3 className={`text-lg font-semibold ${getMoodColor(sentiment.overallMood)}`}>
                      {sentiment.overallMood.charAt(0).toUpperCase() + sentiment.overallMood.slice(1)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Market sentiment is {sentiment.sentiment}
                    </p>
                  </div>
                </div>
                <Badge variant={getMoodBadgeVariant(sentiment.overallMood)}>
                  {sentiment.moodScore}/100
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confidence Level</span>
                  <span>{sentiment.confidence}%</span>
                </div>
                <Progress value={sentiment.confidence} className="h-2" />
              </div>
            </div>

            <Separator />

            {/* Key Indicators */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Key Market Indicators</h4>
              <div className="grid grid-cols-2 gap-4">
                {sentiment.interestRate && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Interest Rate</span>
                    </div>
                    <p className="text-lg font-semibold">{formatBasisPoints(sentiment.interestRate)}</p>
                  </div>
                )}

                {sentiment.housePrice && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Median House Price</span>
                    </div>
                    <p className="text-lg font-semibold">{formatCurrency(sentiment.housePrice)}</p>
                  </div>
                )}

                {sentiment.inflationRate && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Inflation Rate</span>
                    </div>
                    <p className="text-lg font-semibold">{formatBasisPoints(sentiment.inflationRate)}</p>
                  </div>
                )}

                {sentiment.unemploymentRate && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Unemployment</span>
                    </div>
                    <p className="text-lg font-semibold">{formatBasisPoints(sentiment.unemploymentRate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center space-x-1">
                {getSentimentIcon(sentiment.sentiment)}
                <span>Source: {sentiment.dataSource}</span>
              </div>
              <span>
                Updated {formatDistanceToNow(new Date(sentiment.timestamp), { addSuffix: true })}
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No market data available</p>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-2"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Fetch Market Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}