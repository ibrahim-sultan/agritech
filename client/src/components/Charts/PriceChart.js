import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './PriceChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PriceChart = ({ 
  data, 
  title = 'Price Trends', 
  height = 300,
  showPrediction = false,
  cropName = '',
  unit = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="price-chart-container">
        <div className="price-chart-empty">
          <p>📊 No price data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const labels = data.map(item => {
    const date = new Date(item.lastUpdated || item.date);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  });

  const prices = data.map(item => item.pricePerUnit?.value || item.price);

  const chartData = {
    labels,
    datasets: [
      {
        label: `${cropName} Price (${unit})`,
        data: prices,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Price: ₦${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value) {
            return '₦' + value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        hoverBackgroundColor: '#3b82f6'
      }
    }
  };

  // Calculate price statistics
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const latestPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2];
  const priceChange = previousPrice ? ((latestPrice - previousPrice) / previousPrice) * 100 : 0;

  return (
    <div className="price-chart-container">
      <div className="price-chart-header">
        <h3>{title}</h3>
        <div className="price-stats">
          <div className="stat-item">
            <span className="stat-label">Current</span>
            <span className="stat-value">₦{latestPrice?.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Change</span>
            <span className={`stat-value ${priceChange >= 0 ? 'positive' : 'negative'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="chart-wrapper" style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>
      
      <div className="price-summary">
        <div className="summary-item">
          <span className="summary-label">Min</span>
          <span className="summary-value">₦{minPrice.toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg</span>
          <span className="summary-value">₦{Math.round(avgPrice).toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Max</span>
          <span className="summary-value">₦{maxPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;
