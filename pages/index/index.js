// index.js
const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    userInfo: {},
    currentDate: '',
    todayIncome: 0,
    todayExpense: 0,
    recentRecords: []
  },

  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo || {}
    })
    this.getTodayDate()
    this.getTodayStats()
    this.getRecentRecords()
  },

  onShow() {
    // 页面显示时重新获取数据
    this.getTodayStats()
    this.getRecentRecords()
  },

  getTodayDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[now.getDay()]
    this.setData({
      currentDate: `${year}年${month}月${day}日 ${weekDay}`
    })
  },

  getTodayStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    db.collection('records').where({
      openid: app.globalData.openid,
      date: {
        $gte: today,
        $lt: tomorrow
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
          todayIncome: income.toFixed(2),
          todayExpense: expense.toFixed(2)
        })
      },
      fail: err => {
        console.error('获取今日收支失败', err)
      }
    })
  },

  getRecentRecords() {
    db.collection('records').where({
      openid: app.globalData.openid
    }).orderBy('date', 'desc').limit(5).get({
      success: res => {
        this.setData({
          recentRecords: res.data
        })
      },
      fail: err => {
        console.error('获取最近记录失败', err)
      }
    })
  },

  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    })
  },

  goToList() {
    wx.navigateTo({
      url: '/pages/list/list'
    })
  },

  goToDetail(e) {
    const record = e.currentTarget.dataset.record
    wx.navigateTo({
      url: `/pages/add/add?id=${record._id}`
    })
  }
})