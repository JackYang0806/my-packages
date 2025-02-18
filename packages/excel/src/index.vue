<template>
  <div class="excel-import">
    <div class="action-btn" @click="init()">
      <slot v-if="$slots.default" />
      <a v-else class="default-btn" href="javascript:void(0)">{{ title }}</a>
    </div>

    <div class="upload-dialog" v-show="visible" @click="closeModalHandle">
      <div class="upload-dialog-content" :style="dialogStyles">
        <div class="upload-dialog-header">
          <slot v-if="$slots.header" />
          <h4 v-else class="upload-dialog-title">{{ title }}</h4>
          <i
            v-show="showClose"
            class="close modal-close"
            @click="cancelHandle()"
          ></i>
        </div>
        <div class="upload-dialog-body">
          <div class="upload">
            <span class="upload-text">
              上传文件
              <input
                type="file"
                :accept="accept"
                @change="handleChange"
                ref="upload"
              />
            </span>
            <span v-show="file" class="file-name"
              >{{ file && file.name }}
              <i class="close file-remove" @click="onRemoveFile()"></i>
            </span>
          </div>
          <div class="tips">
            <slot v-if="$slots.tips" />
            <a
              v-else
              class="default-tips"
              :href="templateUrl"
              download
              target="_blank"
            >
              {{ tips }}
            </a>
          </div>
          <div class="preview">
            <div class="preview-main">
              <table
                class="preview-table"
                v-show="dataList.length"
                ref="viewTable"
              >
                <thead>
                  <th
                    v-for="col in columns"
                    :key="col.id || col.label"
                    :align="col.headerAlign || 'center'"
                    :width="col.width || 'auto'"
                  >
                    {{ col.label }}
                  </th>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in dataList" :key="index">
                    <td
                      v-for="(itemCol, i) in columns"
                      :key="index + '' + i"
                      :align="itemCol.align || 'center'"
                    >
                      <div
                        :class="{ 'row-index': itemCol.prop === 'rowIndex' }"
                      >
                        {{ row[itemCol.prop] }}
                      </div>
                      <div
                        v-if="row[itemCol.prop + 'Error']"
                        class="error-infos"
                      >
                        {{ row[itemCol.prop + "Error"] }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="preview-fixed-header" ref="headerTable">
              <table class="preview-table" v-show="dataList.length">
                <thead>
                  <th
                    v-for="col in columns"
                    :key="col.id || col.label"
                    :align="col.headerAlign || 'center'"
                    :width="col.width || 'auto'"
                  >
                    {{ col.label }}
                  </th>
                </thead>
              </table>
            </div>
          </div>
          <div class="upload-dialog-loading" v-show="fileReading"></div>
        </div>
        <div class="upload-dialog-footer">
          <slot v-if="$slots.footer" />
          <div v-else class="footer-btns">
            <button class="submit" @click="submitHandle()">提交</button>
            <button class="cancel" @click="cancelHandle()">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import * as XLSX from "xlsx"
export default {
  name: "ExcelImport",
  props: {
    title: {
      type: String,
      default: "导入",
    },
    width: {
      type: [Number, String],
      default: 1000,
    },
    closeOnModal: {
      type: Boolean,
      default: true,
    },
    showClose: {
      type: Boolean,
      default: true,
    },
    tips: {
      type: String,
      // default: "下载模版",
      default: "请上传Excel文件",
    },
    templateUrl: {
      type: String,
      default: "javscript:void(0)",
      // default: window.location.origin + "/public/a.xlsx",
      // 例如：模版文件在当前工程/public/a.xlsx 路径下，则此处填写： window.location.origin + '/public/a.xlsx'
    },
    columns: {
      type: Array,
      default: [
        { field: "name", required: true, message: "姓名不能为空", max: 20 },
        {
          field: "id",
          required: true,
          validator: /^sclead\d{4}$/,
          message: "格式错误，请使用格式如：sclead1001",
          // callback:(value)=>msg  //返回错误字符串 均可视为校验失败 不返回或返回等效false 视为校验通过
        },
        {
          field: "chinese",
          required: true,
          type: "number",
        },
        {
          field: "math",
          required: true,
          type: "number",
        },
        {
          field: "english",
          required: true,
          type: "number",
        },
        {
          field: "remarks",
          required: true,
          max: 200,
        },
      ],
    },
    // 数据开始行
    startRow: {
      type: [Number, Function],
      default: 1,
    },
    //
    startCol: {
      type: [Number, Function],
      default: 0,
    },
    onSubmit: {
      type: Function,
      default: ({ file, errorList, closeModal }) => {
        closeModal()
      },
    },
  },
  computed: {
    dialogStyles({ width }) {
      return {
        width: typeof width === "string" ? width : width + "px" || "400px",
      }
    },
  },
  data() {
    return {
      visible: false,
      fileList: [],
      dataList: [],
      columns: [],
      file: null,
      fileReading: false,
      accept:
        "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  },
  methods: {
    init() {
      this.visible = true
    },
    handleChange(e) {
      const file = e.target.files[0]
      if (!file) return
      this.file = file
      this.$emit("onChange", { ...file })
      const reader = new FileReader()
      this.fileReading = true
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })

        // 获取第一个工作表
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // 转换为 JSON 格式
        const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        const list = this.checkData(arrayData)
        const { columns, errorList } = this.formatData(arrayData, list)
        this.columns = [...columns]
        this.dataList = [...errorList]
        this.fileReading = false
        // 同步table表头宽度
        this.syncTableTdWidth()
        // 触发校验错误事件
        errorList.length &&
          this.$emit("onValidError", {
            file,
            errorList,
          })
      }
      // 处理中文字符编码
      reader.onerror = (e) => {
        this.fileReading = false
        console.error("文件读取错误:", e)
      }

      reader.readAsArrayBuffer(file)
    },
    syncTableTdWidth() {
      this.$nextTick(() => {
        const viewTable = this.$refs.viewTable
        const table = viewTable.getBoundingClientRect()
        const widths = [...viewTable.querySelectorAll("th")].map(
          (item) => item.getBoundingClientRect().width
        )
        // 同步列宽度
        this.columns.forEach((item, index) => {
          item.width = widths[index]
        })
        // 同步表格宽度
        this.$refs.headerTable.style.width = table.width + "px"
      })
    },
    formatData(arrayData, list) {
      const columns = [
        {
          id: "rowIndex",
          label: "错误行数",
          prop: "rowIndex",
          width: 120,
        },
      ].concat(
        arrayData[0].map((value, index) => {
          return {
            id: index,
            label: value,
            prop: `row${index}`,
            width: 200,
          }
        })
      )
      const errorList = list.map((item, index) => {
        const record = item.record.reduce((prev, v, i) => {
          prev[`row${i}`] = v
          return prev
        }, {})
        const errors = item.error.reduce(
          (prev, v, i) => {
            prev[`row${v.col}Error`] = v.msg
            prev.errorMsg += `${i + 1}、${v.msg}\n`
            return prev
          },
          { errorMsg: "" }
        )
        return {
          ...record,
          ...errors,
          errorSource: item.error,
          id: `record${index}`,
          rowIndex: item.row,
        }
      })
      return { columns, errorList }
    },
    checkData(data) {
      let { startCol, startRow, columns } = this
      // 自定义开始列 需要返回数字
      if (startCol && startCol instanceof Function) {
        startCol = Number(startCol(data)) || 0
      }
      // 自定义开始行 需要返回数字
      if (startRow && startRow instanceof Function) {
        startRow = Number(startRow(data)) || 1
      }
      const errorDataList = []
      // 根据配置校验数据
      for (let i = startRow; i < data.length; i++) {
        const record = data[i]
        let error = []
        for (let j = startCol; j < record.length; j++) {
          const cell = record[j]
          const column = columns[j] || {}
          let msg
          //是否必填
          if (!column.required) {
            continue
          }
          // 非空
          if (!cell) {
            msg = `不能为空`
          }
          // 数字
          else if (column.type === "number" && !/^\d+$/.test(cell)) {
            msg = `必须是数字`
          }
          // 日期
          else if (
            column.type === "date" &&
            new Date(cell).toString() === "Invalid Date"
          ) {
            msg = `必须是日期格式`
          }
          // 下拉
          else if (
            column.type === "select" &&
            column.options.includes(cell) === false
          ) {
            msg = `必须是${column.options.join(",")}之一`
          }
          // 自定义  正则校验
          else if (column.validator && !column.validator.test(cell)) {
            msg = column.message || `格式错误`
          }
          // 自定义 回调函数处理
          else if (column.callback && column.callback instanceof Function) {
            msg = column.callback(cell) || false
          }
          // 校验长度
          else if (column.max && cell.length > column.max) {
            msg = `长度不能超过${max}个字符`
          }
          if (msg) {
            error.push({ col: j, row: i, msg })
          }
        }
        if (error.length) {
          errorDataList.push({ row: i + 1, record, error })
        }
      }
      return errorDataList
    },
    closeModalHandle(ev) {
      if (this.closeOnModal && ev.target.className === "upload-dialog") {
        this.cancelHandle()
      }
    },
    closeModal() {
      this.visible = false
    },
    onRemoveFile() {
      this.$emit("onRemove", { ...this.file })
      this.$refs.upload.value = ""
      this.file = null
      this.columns = []
      this.dataList = []
    },
    submitHandle() {
      if (!this.file) {
        this.cancelHandle()
        return false
      }
      this.onSubmit({
        file: this.file,
        errorList: this.dataList,
        closeModal: this.cancelHandle,
      })
    },
    cancelHandle() {
      this.$refs.upload.value = ""
      this.file = null
      this.columns = []
      this.dataList = []
      this.closeModal()
    },
  },
}
</script>
<style lang="scss" scoped>
a {
  text-decoration: none;
}
.excel-import {
  margin: 0 10px 10px;
  .action-btn {
    --l-height: 32px;
    line-height: var(--l-height);
    .default-btn {
      display: inline-block;
      vertical-align: top;
      padding: 0 20px;
      line-height: var(--l-height);
      font-size: 14px;
      background: #409eff;
      color: #fff;
      border-radius: 4px;
    }
  }
}
.close {
  --close-height: 16px;
  width: var(--close-height);
  height: var(--close-height);
  cursor: pointer;
  &::before,
  &::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 1px;
    height: var(--close-height);
    transform-origin: center center;
    background: #333;
  }
  &::before {
    transform: translateY(-50%) rotate(45deg);
  }
  &::after {
    transform: translateY(-50%) rotate(-45deg);
  }
}
.upload-dialog {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba($color: #000000, $alpha: 0.4);
  z-index: 2000;
  .upload-dialog-content {
    border-radius: 6px;
    background: #f8f8f8;
    margin: 15vh auto 0;
    padding: 20px;
    position: relative;
    .upload-dialog-header {
      h4 {
        font-weight: normal;
        font-size: 16px;
        text-align: left;
        margin: 0 0 20px 0;
        padding: 0;
      }
      .modal-close {
        position: absolute;
        right: 10px;
        top: 10px;
        --close-height: 16px;
        width: var(--close-height);
        height: var(--close-height);
        cursor: pointer;
        &::before,
        &::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 0;
          width: 1px;
          height: var(--close-height);
          transform-origin: center center;
          background: #333;
        }
        &::before {
          transform: rotate(45deg);
        }
        &::after {
          transform: rotate(-45deg);
        }
      }
    }
    .upload-dialog-body {
      position: relative;
      .upload {
        line-height: 32px;
        .upload-text {
          display: inline-block;
          vertical-align: top;
          line-height: inherit;
          text-align: center;
          background: #409eff;
          color: #fff;
          padding: 0 20px;
          position: relative;
          border-radius: 3px;
          input {
            position: absolute;
            inset: 0;
            z-index: 1;
            opacity: 0;
            cursor: pointer;
          }
        }
        .file-name {
          display: inline-block;
          margin-left: 10px;
        }
        .file-remove {
          --close-height: 12px;
          position: relative;
          height: 32px;
          margin-left: 10px;
        }
      }
      .tips {
        line-height: 1;
        padding-top: 10px;
        .default-tips {
          font-size: 12px;
          color: #999;
        }
      }
      .preview {
        margin-top: 15px;
        overflow: hidden;
        position: relative;
        .preview-main {
          max-height: 50vh;
          overflow: auto;
          padding: 0 0 1px 0;
        }
        .preview-fixed-header {
          position: absolute;
          left: 0;
          top: 0;
          height: 42px;
          overflow-y: hidden;
        }
        .preview-table {
          min-width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          border: solid 1px #e5e5e5;
          th {
            text-align: center;
            background: #e8f3ff;
            font-weight: normal;
          }
          th,
          td {
            border: solid 1px #e5e5e5;
            padding: 10px 10px;
            line-height: 20px;
            font-size: 14px;
            .row-index {
              font-weight: bold;
              color: red;
              text-align: center;
            }
            .error-infos {
              color: red;
              font-size: 12px;
            }
          }
          tr:hover {
            background: #e8f3ff;
          }
        }
      }
      .upload-dialog-loading {
        position: absolute;
        inset: 0;
        background: rgba($color: #fff, $alpha: 0.5);
        &::after {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          transform-origin: center center;
          content: "";
          --w: 20px;
          width: var(--w);
          height: var(--w);
          border: solid 2px #409eff;
          border-left-color: transparent;
          border-radius: 50%;
          animation: loading 1s linear infinite;
        }
        &::before {
          content: "文件解析中...";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(20px, -50%);
          color: #999;
          font-size: 12px;
        }
      }
    }
    .upload-dialog-footer {
      text-align: right;
      padding-top: 15px;
      .footer-btns {
        button {
          --bg: #409eff;
          --color: #fff;
          border: solid 1px var(--bg);
          outline: none;
          background: var(--bg);
          color: var(--color);
          border-radius: 4px;
          padding: 0 20px;
          line-height: 32px;
          margin-left: 10px;
          font-size: 14px;
          &.cancel {
            --bg: #fff;
            --color: #666;
            border-color: #dcdfe6;
          }
        }
      }
    }
  }
}
</style>
<style>
@keyframes loading {
  from {
    transform: translate(-50%, -50%) rotate(0);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
