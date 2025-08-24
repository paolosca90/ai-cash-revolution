import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Brush } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  TrendingUp, 
  TrendingDown,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

interface MobileChartProps {
  data: Array<{
    time: string;
    value: number;
    volume?: number;
    high?: number;
    low?: number;
    open?: number;
    close?: number;
  }>;
  title?: string;
  symbol?: string;
  height?: number;
  showControls?: boolean;
  type?: 'line' | 'candlestick' | 'area';
  color?: string;
  className?: string;
}

const MobileChart: React.FC<MobileChartProps> = ({
  data,
  title = "Price Chart",
  symbol = "",
  height = 300,
  showControls = true,
  type = 'line',
  color = '#2563eb',
  className
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const { device, vibration, fullscreen } = useMobileFeatures();

  // Calculate trend and percentage change
  const trend = data.length > 1 ? 
    (data[data.length - 1].value > data[0].value ? 'up' : 'down') : 'neutral';
  
  const percentChange = data.length > 1 ? 
    ((data[data.length - 1].value - data[0].value) / data[0].value * 100) : 0;

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!device.isMobile) return;
    
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    });
  }, [device.isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY
    });
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const minSwipeDistance = 50;

    // Detect pinch zoom (simplified)
    if (Math.abs(deltaY) < 30 && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - zoom out
        handleZoomOut();
      } else {
        // Swipe left - zoom in  
        handleZoomIn();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd]);

  // Chart control handlers
  const handleZoomIn = useCallback(() => {
    if (device.isMobile) {
      vibration.vibratePattern('tap');
    }
    setZoomLevel(prev => Math.min(prev * 1.5, 5));
  }, [device.isMobile, vibration]);

  const handleZoomOut = useCallback(() => {
    if (device.isMobile) {
      vibration.vibratePattern('tap');
    }
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  }, [device.isMobile, vibration]);

  const handleReset = useCallback(() => {
    if (device.isMobile) {
      vibration.vibratePattern('light');
    }
    setZoomLevel(1);
  }, [device.isMobile, vibration]);

  const handleFullscreen = useCallback(async () => {
    if (device.isMobile && chartRef.current) {
      vibration.vibratePattern('medium');
      
      if (!isFullscreen) {
        const success = await fullscreen.enter(chartRef.current);
        setIsFullscreen(success);
      } else {
        const success = await fullscreen.exit();
        setIsFullscreen(!success);
      }
    }
  }, [device.isMobile, vibration, fullscreen, isFullscreen]);

  // Format data for the chart
  const chartData = data.map((item, index) => ({
    ...item,
    name: item.time,
    index,
    price: item.value
  }));

  // Calculate brush domain based on zoom
  const dataLength = chartData.length;
  const visibleData = Math.floor(dataLength / zoomLevel);
  const startIndex = Math.max(0, dataLength - visibleData);

  return (
    <Card 
      ref={chartRef}
      className={cn(
        "overflow-hidden",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
    >
      {/* Header */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{title}</CardTitle>
            {symbol && (
              <Badge variant="outline" className="text-xs">
                {symbol}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Trend indicator */}
            <div className="flex items-center gap-1">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Activity className="h-4 w-4 text-gray-600" />
              )}
              <span className={cn(
                "text-sm font-mono",
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 'text-gray-600'
              )}>
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Chart */}
      <CardContent className="p-0 relative">
        <div
          className="touch-manipulation"
          style={{ height: isFullscreen ? '70vh' : height }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                fontSize={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                fontSize={10}
                domain={['dataMin - 10', 'dataMax + 10']}
                tickFormatter={(value) => value.toFixed(2)}
              />
              
              {/* Main price line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={device.isMobile ? 2 : 1.5}
                dot={false}
                activeDot={{ 
                  r: device.isMobile ? 6 : 4, 
                  stroke: color,
                  strokeWidth: 2
                }}
              />
              
              {/* Support/Resistance levels if provided */}
              {data.some(d => d.high && d.low) && (
                <>
                  <ReferenceLine 
                    y={Math.max(...data.map(d => d.high || 0))} 
                    stroke="#ef4444" 
                    strokeDasharray="3 3" 
                    strokeWidth={1}
                    label={{ value: "Resistance", position: "topRight" }}
                  />
                  <ReferenceLine 
                    y={Math.min(...data.map(d => d.low || Infinity))} 
                    stroke="#22c55e" 
                    strokeDasharray="3 3" 
                    strokeWidth={1}
                    label={{ value: "Support", position: "bottomRight" }}
                  />
                </>
              )}
              
              {/* Brush for mobile navigation */}
              {device.isMobile && chartData.length > 20 && (
                <Brush
                  dataKey="name"
                  height={30}
                  stroke={color}
                  startIndex={startIndex}
                  endIndex={chartData.length - 1}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Mobile Controls */}
        {showControls && device.isMobile && (
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 bg-white/80 backdrop-blur-sm"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 bg-white/80 backdrop-blur-sm"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 bg-white/80 backdrop-blur-sm"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            {fullscreen.isSupported && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 bg-white/80 backdrop-blur-sm"
                onClick={handleFullscreen}
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Touch instructions */}
        {device.isMobile && (
          <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
            Swipe to zoom • Tap chart to interact
          </div>
        )}
      </CardContent>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <Button
            variant="outline"
            onClick={handleFullscreen}
            className="bg-white/90 backdrop-blur-sm"
          >
            Exit Fullscreen
          </Button>
        </div>
      )}
    </Card>
  );
};

export default MobileChart;