# survey-data-chart

## NEED
* chart.js@4.5.1
* chartjs-plugin-datalabels@2

## USED

### draw single chice 繪製單選題 (堆疊長條圖)
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
})
 * {object} config - 圖表配置物件
 * {string} config.canvasId - <canvas> 元素的 ID
 * {string} config.userAns - 使用者選擇的答案名稱
 * {string[]} config.allAns - 所有可能的答案選項
 * {string[]} config.colors - 答案選項對應的顏色
 * {string[]} config.labels - 堆疊軸的標籤 (例如: ['全產業', '你的產業'])
 * {number[][]} config.ratios - 二維陣列 [[全產業數據], [使用者的產業數據]]
 * {string} [config.userColor='#3fa9f5'] - 凸顯使用者答案的邊框顏色
 * {boolean} [config.showLegend=true] - 是否顯示圖例
 * {boolean} [config.showPercent=true] - 是否顯示數據標籤
 * {string} [config.dataSuffix=''] - 數據標籤的後綴

### draw multi chice 繪製複選題 (非堆疊長條圖)
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
})
 * {object} config - 圖表配置物件
 * {string} config.canvasId - <canvas> 元素的 ID
 * {string[]} config.labels - X 軸選項名稱 (例如: ['選項A', '選項B', '選項C'])
 * {number[][]} config.ratios - 二維陣列 [[全產業數據], [你的產業數據]]
 * {string[]} config.userAns - 使用者選擇的所有答案 (例如: ['選項A', '選項C'])
 * {string[]} [config.barColors=['#a6cee3', '#1f78b4']] - [全產業顏色, 你的產業顏色]
 * {string[]} [config.datasetLabels=['全產業', '你的產業']] - 圖例名稱
 * {boolean} [config.showPercent=true] - 是否顯示數據標籤
 * {string} [config.dataSuffix='%'] - 數據標籤的後綴
 * {string} [config.highlightColor='#58A8E280'] - 答案高亮的背景色
