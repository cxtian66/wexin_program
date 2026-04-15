// list.js
const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    records: [],
    selectedDateRange: '全部时间',
    selectedCategory: '',
    hasMore: true,
    page: 1,
    pageSize: 20
  },

  onLoad() {
    this.getRecords()
  },

  getRecords(reset = false) {
    if (reset) {
      this.setData({
        records: [],
        page: 1,
        hasMore: true
      })
    }

    const { page, pageSize, selectedDateRange, selectedCategory } = this.data
    const skip = (page - 1) * pageSize

    let query = db.collection('records').where({
      openid: app.globalData.openid
    })

    // 日期筛选
    if (selectedDateRange !== '全部时间') {
      const now = new Date()
      let startDate, endDate
      
      switch (selectedDateRange) {
        case '今天':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case '本周':
          const dayOfWeek = now.getDay() || 7
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1)
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 8)
          break
        case '本月':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          break
        case '本年':
          startDate = new Date(now.getFullYear(), 0, 1)
          endDate = new Date(now.getFullYear() + 1, 0, 1)
          break
      }

      query = query.where({
        date: {
          $gte: startDate,
          $lt: endDate
        }
      })
    }

    // 分类筛选
    if (selectedCategory) {
      query = query.where({
        category: selectedCategory
      })
    }

    query.orderBy('date', 'desc').skip(skip).limit(pageSize).get({
      success: res => {
        if (res.data.length < pageSize) {
          this.setData({
            hasMore: false
          })
        }

        this.setData({
          records: reset ? res.data : [...this.data.records, ...res.data],
          page: page + 1
        })
      },
      fail: err => {
        console.error('获取记录失败', err)
      }
    })
  },

  openDateFilter() {
    wx.showActionSheet({
      itemList: ['全部时间', '今天', '本周', '本月', '本年'],
      success: res => {
        const dateRange = ['全部时间', '今天', '本周', '本月', '本年'][res.tapIndex]
        this.setData({
          selectedDateRange: dateRange
        })
        this.getRecords(true)
      }
    })
  },

  openCategoryFilter() {
    db.collection('categories').get({
      success: res => {
        const categories = res.data.map(c => c.name)
        const items = ['全部分类', ...categories]
        wx.showActionSheet({
          itemList: items,
          success: res => {
            if (res.tapIndex === 0) {
              this.setData({
                selectedCategory: ''
              })
            } else {
              const category = categories[res.tapIndex - 1]
              const categoryId = res.data.find(c => c.name === category)._id
              this.setData({
                selectedCategory: category,
                selectedCategoryId: categoryId
              })
            }
            this.getRecords(true)
          }
        })
      }
    })
  },

  goToEdit(e) {
    const record = e.currentTarget.dataset.record
    wx.navigateTo({
      url: `/pages/add/add?id=${record._id}`
    })
  },

  loadMore() {
    if (this.data.hasMore) {
      this.getRecords()
    }
  },

  formatDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})