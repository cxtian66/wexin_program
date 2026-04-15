// add.js
const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    type: 2, // 默认支出
    amount: '',
    selectedCategory: '',
    categories: [],
    date: '',
    time: '',
    remark: '',
    isEdit: false,
    recordId: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        isEdit: true,
        recordId: options.id
      })
      this.getRecordDetail(options.id)
    }
    this.getCategories()
    this.setDefaultDate()
  },

  setDefaultDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    this.setData({
      date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    })
  },

  getCategories() {
    db.collection('categories').where({
      type: this.data.type
    }).orderBy('sort', 'asc').get({
      success: res => {
        if (res.data.length === 0) {
          // 使用默认分类数据
          const defaultCategories = this.data.type === 1 ? 
            [
              { _id: '1', name: '工资', icon: '💰', color: '#2ECC71', sort: 1, isDefault: true },
              { _id: '2', name: '奖金', icon: '🎁', color: '#3498DB', sort: 2, isDefault: true },
              { _id: '3', name: '投资', icon: '📈', color: '#9B59B6', sort: 3, isDefault: true },
              { _id: '4', name: '其他', icon: '📦', color: '#F39C12', sort: 4, isDefault: true }
            ] : 
            [
              { _id: '5', name: '餐饮', icon: '🍔', color: '#FF6B6B', sort: 1, isDefault: true },
              { _id: '6', name: '交通', icon: '🚗', color: '#4ECDC4', sort: 2, isDefault: true },
              { _id: '7', name: '购物', icon: '🛍️', color: '#45B7D1', sort: 3, isDefault: true },
              { _id: '8', name: '娱乐', icon: '🎮', color: '#96CEB4', sort: 4, isDefault: true },
              { _id: '9', name: '医疗', icon: '🏥', color: '#FFEAA7', sort: 5, isDefault: true },
              { _id: '10', name: '教育', icon: '📚', color: '#DDA0DD', sort: 6, isDefault: true },
              { _id: '11', name: '住房', icon: '🏠', color: '#98D8C8', sort: 7, isDefault: true },
              { _id: '12', name: '其他', icon: '📦', color: '#F7DC6F', sort: 8, isDefault: true }
            ];
          
          this.setData({
            categories: defaultCategories
          });
          
          if (defaultCategories.length > 0 && !this.data.selectedCategory) {
            this.setData({
              selectedCategory: defaultCategories[0]._id
            });
          }
        } else {
          this.setData({
            categories: res.data
          });
          
          if (res.data.length > 0 && !this.data.selectedCategory) {
            this.setData({
              selectedCategory: res.data[0]._id
            });
          }
        }
      },
      fail: err => {
        console.error('获取分类失败', err);
        // 使用默认分类数据
        const defaultCategories = this.data.type === 1 ? 
          [
            { _id: '1', name: '工资', icon: '💰', color: '#2ECC71', sort: 1, isDefault: true },
            { _id: '2', name: '奖金', icon: '🎁', color: '#3498DB', sort: 2, isDefault: true },
            { _id: '3', name: '投资', icon: '📈', color: '#9B59B6', sort: 3, isDefault: true },
            { _id: '4', name: '其他', icon: '📦', color: '#F39C12', sort: 4, isDefault: true }
          ] : 
          [
            { _id: '5', name: '餐饮', icon: '🍔', color: '#FF6B6B', sort: 1, isDefault: true },
            { _id: '6', name: '交通', icon: '🚗', color: '#4ECDC4', sort: 2, isDefault: true },
            { _id: '7', name: '购物', icon: '🛍️', color: '#45B7D1', sort: 3, isDefault: true },
            { _id: '8', name: '娱乐', icon: '🎮', color: '#96CEB4', sort: 4, isDefault: true },
            { _id: '9', name: '医疗', icon: '🏥', color: '#FFEAA7', sort: 5, isDefault: true },
            { _id: '10', name: '教育', icon: '📚', color: '#DDA0DD', sort: 6, isDefault: true },
            { _id: '11', name: '住房', icon: '🏠', color: '#98D8C8', sort: 7, isDefault: true },
            { _id: '12', name: '其他', icon: '📦', color: '#F7DC6F', sort: 8, isDefault: true }
          ];
        
        this.setData({
          categories: defaultCategories
        });
        
        if (defaultCategories.length > 0 && !this.data.selectedCategory) {
          this.setData({
            selectedCategory: defaultCategories[0]._id
          });
        }
      }
    })
  },

  getRecordDetail(id) {
    db.collection('records').doc(id).get({
      success: res => {
        const record = res.data
        this.setData({
          type: record.type,
          amount: record.amount.toString(),
          selectedCategory: record.category,
          date: this.formatDate(record.date),
          time: record.time,
          remark: record.remark
        })
        // 重新获取对应类型的分类
        this.getCategories()
      },
      fail: err => {
        console.error('获取记录详情失败', err)
      }
    })
  },

  formatDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  selectType(e) {
    const type = parseInt(e.currentTarget.dataset.type)
    this.setData({
      type: type,
      selectedCategory: ''
    })
    this.getCategories()
  },

  onAmountChange(e) {
    this.setData({
      amount: e.detail.value
    })
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category._id
    })
  },

  openDatePicker() {
    wx.showDatePicker({
      start: '2020-01-01',
      end: '2030-12-31',
      current: this.data.date,
      success: res => {
        this.setData({
          date: res.value
        })
      }
    })
  },

  onRemarkChange(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  saveRecord() {
    const { type, amount, selectedCategory, date, time, remark, isEdit, recordId } = this.data

    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入正确的金额', icon: 'none' })
      return
    }

    if (!selectedCategory) {
      wx.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    const category = this.data.categories.find(c => c._id === selectedCategory)
    const recordData = {
      openid: app.globalData.openid,
      type: type,
      amount: parseFloat(amount),
      category: selectedCategory,
      categoryName: category.name,
      date: new Date(date),
      time: time,
      remark: remark,
      updatedAt: new Date()
    }

    if (isEdit) {
      // 更新记录
      db.collection('records').doc(recordId).update({
        data: recordData,
        success: res => {
          wx.showToast({ title: '更新成功' })
          wx.navigateBack()
        },
        fail: err => {
          console.error('更新记录失败', err)
          wx.showToast({ title: '更新失败', icon: 'none' })
        }
      })
    } else {
      // 添加新记录
      recordData.createdAt = new Date()
      db.collection('records').add({
        data: recordData,
        success: res => {
          wx.showToast({ title: '保存成功' })
          // 清空表单
          this.setData({
            amount: '',
            selectedCategory: this.data.categories[0]?.id || '',
            date: this.formatDate(new Date()),
            time: this.data.time,
            remark: ''
          })
        },
        fail: err => {
          console.error('保存记录失败', err)
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      })
    }
  }
})