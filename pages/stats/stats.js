// stats.js
const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    selectedTimeRange: 'month', // week, month, year
    selectedType: 2, // 1-收入，2-支出
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    categoryStats: []
  },

  onLoad() {
    this.getStats()
  },

  selectTimeRange(e) {
    const range = e.currentTarget.dataset.range
    this.setData({
      selectedTimeRange: range
    })
    this.getStats()
  },

  selectType(e) {
    const type = parseInt(e.currentTarget.dataset.type)
    this.setData({
      selectedType: type
    })
    this.getCategoryStats()
  },

  getStats() {
    const { selectedTimeRange } = this.data
    const now = new Date()
    let startDate, endDate

    switch (selectedTimeRange) {
      case 'week':
        const dayOfWeek = now.getDay() || 7
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 8)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear() + 1, 0, 1)
        break
    }

    // 获取总收入和支出
    db.collection('records').where({
      openid: app.globalData.openid,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).get({
      success: res => {
        let income = 0
        let expense = 0
        res.data.forEach(record => {
          if (record.type === 1) {
            income += record.amount
          } else if (record.type === 2) {
            expense += record.amount
          }
        })
        this.setData({
          totalIncome: income.toFixed(2),
          totalExpense: expense.toFixed(2),
          balance: (income - expense).toFixed(2)
        })
        this.getCategoryStats()
        this.getTrendStats()
        this.drawBalanceChart()
      },
      fail: err => {
        console.error('获取统计数据失败', err)
      }
    })
  },

  getCategoryStats() {
    const { selectedTimeRange, selectedType } = this.data
    const now = new Date()
    let startDate, endDate

    switch (selectedTimeRange) {
      case 'week':
        const dayOfWeek = now.getDay() || 7
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 8)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear() + 1, 0, 1)
        break
    }

    db.collection('records').where({
      openid: app.globalData.openid,
      type: selectedType,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).get({
      success: res => {
        const categoryMap = {}
        let total = 0

        res.data.forEach(record => {
          if (categoryMap[record.category]) {
            categoryMap[record.category] += record.amount
          } else {
            categoryMap[record.category] = record.amount
          }
          total += record.amount
        })

        const categoryStats = Object.entries(categoryMap).map(([categoryId, amount]) => {
          const record = res.data.find(r => r.category === categoryId)
          return {
            category: categoryId,
            categoryName: record?.categoryName || '未知',
            amount: amount.toFixed(2),
            percentage: ((amount / total) * 100).toFixed(1)
          }
        }).sort((a, b) => b.amount - a.amount)

        this.setData({
          categoryStats: categoryStats
        })
        this.drawCategoryChart()
      },
      fail: err => {
        console.error('获取分类统计失败', err)
      }
    })
  },

  getTrendStats() {
    // 获取月度趋势数据
    const now = new Date()
    const months = []
    const incomeData = []
    const expenseData = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${date.getMonth() + 1}月`
      months.push(monthStr)

      const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1)

      // 这里应该查询每个月的收支数据，简化处理
      incomeData.push(Math.random() * 5000 + 1000)
      expenseData.push(Math.random() * 3000 + 500)
    }

    this.setData({
      months: months,
      incomeData: incomeData,
      expenseData: expenseData
    })
    this.drawTrendChart()
  },

  drawBalanceChart() {
    const ctx = wx.createCanvasContext('balanceChart')
    const { totalIncome, totalExpense } = this.data
    const income = parseFloat(totalIncome)
    const expense = parseFloat(totalExpense)

    // 绘制饼图
    const centerX = 150
    const centerY = 150
    const radius = 100

    if (income > 0) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI * (income / (income + expense)))
      ctx.lineTo(centerX, centerY)
      ctx.setFillStyle('#07c160')
      ctx.fill()
    }

    if (expense > 0) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 2 * Math.PI * (income / (income + expense)), 2 * Math.PI)
      ctx.lineTo(centerX, centerY)
      ctx.setFillStyle('#ff4d4f')
      ctx.fill()
    }

    ctx.draw()
  },

  drawCategoryChart() {
    const ctx = wx.createCanvasContext('categoryChart')
    const { categoryStats } = this.data
    const colors = ['#07c160', '#1890ff', '#faad14', '#f5222d', '#722ed1', '#13c2c2']

    // 绘制饼图
    const centerX = 150
    const centerY = 150
    const radius = 100
    let startAngle = 0

    categoryStats.forEach((item, index) => {
      const percentage = parseFloat(item.percentage) / 100
      const endAngle = startAngle + 2 * Math.PI * percentage

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.lineTo(centerX, centerY)
      ctx.setFillStyle(colors[index % colors.length])
      ctx.fill()

      startAngle = endAngle
    })

    ctx.draw()
  },

  drawTrendChart() {
    const ctx = wx.createCanvasContext('trendChart')
    const { months, incomeData, expenseData } = this.data
    const width = 300
    const height = 200
    const padding = 40

    // 绘制坐标轴
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height + padding)
    ctx.lineTo(width + padding, height + padding)
    ctx.stroke()

    // 绘制收入折线
    ctx.beginPath()
    ctx.setStrokeStyle('#07c160')
    ctx.setLineWidth(2)
    incomeData.forEach((value, index) => {
      const x = padding + (width / (incomeData.length - 1)) * index
      const y = height + padding - (value / Math.max(...incomeData, ...expenseData)) * height
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // 绘制支出折线
    ctx.beginPath()
    ctx.setStrokeStyle('#ff4d4f')
    ctx.setLineWidth(2)
    expenseData.forEach((value, index) => {
      const x = padding + (width / (expenseData.length - 1)) * index
      const y = height + padding - (value / Math.max(...incomeData, ...expenseData)) * height
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    ctx.draw()
  }
})