// 確保 Chart.js 和 ChartDataLabels 已經載入
if (typeof Chart === 'undefined' || typeof ChartDataLabels === 'undefined') {
  console.error('Chart.js 或 Chartjs-plugin-datalabels 尚未載入。請確保外部函式庫在本腳本之前載入。');
}

// 建立一個全局物件作為命名空間，供外部呼叫
window.SurveyCharts = {};

/**
 * 根據背景顏色的亮度，回傳適合的文字顏色 (黑或白)
 * @param {string} hexColor - 6位數或3位數的Hex顏色字串 (#RRGGBB)
 * @returns {string} - '#000' (黑) 或 '#fff' (白)
 */
function getContrastColor(hexColor) {
  // 移除 # 符號
  const hex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;

  // 將 3 位數縮寫轉換為 6 位數
  const fullHex = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;

  // 轉換為 RGB
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  // 計算亮度 (Luminance)。使用 WCAG 2.0 亮度公式。
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  
  // 亮度閾值: 0.5 - 亮度高於 0.5 (亮色) 回傳黑色文字; 否則 (暗色) 回傳白色文字。
  const threshold = 0.5; 

  return luminance > threshold ? '#000' : '#fff';
}


/**
 * 繪製單選題 (堆疊長條圖)
 * @param {object} config - 圖表配置物件
 * @param {string} config.canvasId - <canvas> 元素的 ID
 * @param {string} config.userAns - 使用者選擇的答案名稱
 * @param {string[]} config.allAns - 所有可能的答案選項
 * @param {string[]} config.colors - 答案選項對應的顏色
 * @param {string[]} config.labels - 堆疊軸的標籤 (例如: ['全產業', '你的產業'])
 * @param {number[][]} config.ratios - 二維陣列 [[全產業數據], [使用者的產業數據]]
 * @param {string} [config.userColor='#3fa9f5'] - 凸顯使用者答案的邊框顏色
 * @param {boolean} [config.showLegend=true] - 是否顯示圖例
 * @param {boolean} [config.showPercent=true] - 是否顯示數據標籤
 * @param {string} [config.dataSuffix=''] - 數據標籤的後綴
 */
SurveyCharts.drawSingleSelectChart = function({
  canvasId,
  userAns,
  allAns,
  colors,
  labels,
  ratios,
  userColor = '#3fa9f5',
  showLegend = true,
  showPercent = true,
  dataSuffix = ''
}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element with ID "${canvasId}" not found.`);
    return;
  }

  // 銷毀舊圖表實例
  if (ctx.chart) {
    ctx.chart.destroy();
  }
  
  const datasets = allAns.map((name, i) => ({
    label: name,
    data: ratios.map(r => r[i]),
    backgroundColor: colors[i],
    
    // 條件式設定 borderColor (只在 '你的產業' 軸凸顯使用者答案)
    borderColor: (context) => {
      if (context.dataIndex === 1 && name === userAns) {
        return userColor;
      }
      return colors[i]; 
    },
    
    // 條件式設定 borderWidth (只在 '你的產業' 軸凸顯使用者答案)
    borderWidth: (context) => {
      if (context.dataIndex === 1 && name === userAns) {
        return 4;
      }
      return 0;
    },
    
    // 邊框跳過邏輯：'全產業' (0) 使用預設 ('start'), '你的產業' (1) 顯示完整邊框 (false)
    borderSkipped: (context) => context.dataIndex === 0 ? 'start' : false,
  }));

  ctx.chart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: { enabled: false },
        legend: {
          display: showLegend,
          position: 'bottom',
          labels: {
            generateLabels: chart => {
              const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              return [
                ...original,
                {
                  text: '你的答案 (邊框)',
                  fillStyle: 'white',
                  strokeStyle: userColor,
                  lineWidth: 4,
                },
              ];
            },
            boxWidth: 20,
          },
        },
        datalabels: showPercent ? {
          // 動態選擇文字顏色 (針對每個 segment)
          color: (context) => {
            const segmentColor = colors[context.datasetIndex];
            return getContrastColor(segmentColor);
          },
          font: { size: 12, weight: 'bold' },
          formatter: value => value + dataSuffix,
          anchor: 'center',
          align: 'center',
        } : null,
      },
      scales: {
        x: {
          stacked: true,
          display: true,
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: function(value) {
              return value;
            },
            color: '#6b7280',
            font: { size: 10 }
          },
          grid: {
            drawOnChartArea: true,
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1,
            borderDash: [5, 5] 
          }
        },
        y: { 
          stacked: true,
          grid: { display: false },
          ticks: { font: { size: 14, weight: 'bold' } }
        },
      },
    },
    plugins: [ChartDataLabels],
  });
};


// 複選題專用的背景高亮 Plugin
const backgroundHighlightPlugin = {
  id: 'backgroundHighlight',
  // 在繪製圖表元素 (Dataset) 之前繪製，確保背景在長條圖之下
  beforeDraw(chart, args, options) {
    const { ctx, chartArea: { top, bottom, width, height }, scales: { x } } = chart;
    ctx.save();
    
    // 從 options 讀取配置
    // FIX: 如果 backgroundHighlight 配置不存在，預設為空物件 {}，防止 TypeError
    const config = chart.options.backgroundHighlight || {}; 
    const highlightFillColor = config.highlightFillColor || '#58A8E280'; 
    const labels = chart.data.labels;
    const userAns = config.userAns || []; // 確保 userAns 預設為空陣列
    
    ctx.fillStyle = highlightFillColor;

    labels.forEach((label, index) => {
      if (userAns.includes(label)) {
        const xCenter = x.getPixelForValue(label);
        let barWidth;
        
        if (labels.length === 1) {
            barWidth = width / 2; 
        } else if (index < labels.length - 1) {
          const nextX = x.getPixelForValue(labels[index + 1]);
          barWidth = nextX - xCenter; 
        } else {
          const prevX = x.getPixelForValue(labels[index - 1]);
          barWidth = xCenter - prevX;
        }

        const drawX = xCenter - (barWidth / 2);
        const drawY = top;
        const drawHeight = bottom - top;
        
        const boundedX = Math.max(drawX, x.left);
        const boundedWidth = Math.min(barWidth, x.right - boundedX);
        
        ctx.fillRect(boundedX, drawY, boundedWidth, drawHeight);
      }
    });

    ctx.restore();
  }
};
// 註冊插件
Chart.register(backgroundHighlightPlugin);


/**
 * 繪製複選題 (非堆疊長條圖)
 * @param {object} config - 圖表配置物件
 * @param {string} config.canvasId - <canvas> 元素的 ID
 * @param {string[]} config.labels - X 軸選項名稱 (例如: ['選項A', '選項B', '選項C'])
 * @param {number[][]} config.ratios - 二維陣列 [[全產業數據], [你的產業數據]]
 * @param {string[]} config.userAns - 使用者選擇的所有答案 (例如: ['選項A', '選項C'])
 * @param {string[]} [config.barColors=['#a6cee3', '#1f78b4']] - [全產業顏色, 你的產業顏色]
 * @param {string[]} [config.datasetLabels=['全產業', '你的產業']] - 圖例名稱
 * @param {boolean} [config.showPercent=true] - 是否顯示數據標籤
 * @param {string} [config.dataSuffix='%'] - 數據標籤的後綴
 * @param {string} [config.highlightColor='#58A8E280'] - 答案高亮的背景色
 */
SurveyCharts.drawMultiSelectChart = function({
  canvasId,
  labels, 
  ratios, 
  userAns, 
  barColors = ['#a6cee3', '#1f78b4'],
  datasetLabels = ['全產業', '你的產業'],
  showPercent = true,
  dataSuffix = '%',
  highlightColor = '#58A8E280'
}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element with ID "${canvasId}" not found.`);
    return;
  }

  if (ctx.chart) {
    ctx.chart.destroy();
  }

  const datasets = [
    // Dataset 0: 全產業 (Bar 1)
    {
      label: datasetLabels[0],
      data: ratios[0],
      backgroundColor: barColors[0],
      borderColor: barColors[0],
      borderWidth: 1,
      borderRadius: 4,
      maxBarThickness: 30,
    },
    // Dataset 1: 你的產業 (Bar 2)
    {
      label: datasetLabels[1],
      data: ratios[1],
      backgroundColor: barColors[1],
      borderColor: barColors[1],
      borderWidth: 1,
      borderRadius: 4,
      maxBarThickness: 30,
    },
  ];


  ctx.chart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // 傳遞高亮顏色和使用者答案給 Plugin
      backgroundHighlight: {
        highlightFillColor: highlightColor,
        userAns: userAns
      },
      plugins: {
        tooltip: { enabled: false },
        legend: {
          position: 'bottom',
          labels: {
            generateLabels: chart => {
              const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              return [
                ...original,
                {
                  text: '你的答案 (背景高亮)',
                  fillStyle: highlightColor, 
                  strokeStyle: highlightColor, 
                  lineWidth: 1,
                  borderRadius: 4,
                },
              ];
            },
            boxWidth: 20,
          },
        },
        datalabels: showPercent ? {
          // 動態選擇文字顏色 (針對兩個 dataset 的顏色)
          color: (context) => {
            const barColor = context.datasetIndex === 0 ? barColors[0] : barColors[1];
            return getContrastColor(barColor);
          },
          font: { size: 12, weight: 'bold' },
          formatter: value => value + dataSuffix,
          anchor: 'center', 
          align: 'center',
          offset: 0,
        } : null,
      },
      scales: {
        x: {
          grid: { display: false }, 
          ticks: { font: { size: 12 } },
        },
        y: { 
          min: 0,
          max: 100, 
          ticks: {
            stepSize: 20, 
            callback: function(value) {
              return value;
            },
            color: '#6b7280',
            font: { size: 10 }
          },
          grid: {
            drawOnChartArea: true,
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1,
            borderDash: [5, 5] 
          }
        },
      },
    },
    plugins: [ChartDataLabels, backgroundHighlightPlugin],
  });
};
