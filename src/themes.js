// Shared design tokens for the approved glass interface.
export const macTheme = {
  token: {
    colorPrimary: '#007aff', colorInfo: '#007aff', colorSuccess: '#248a3d',
    colorWarning: '#b66a00', colorError: '#d73333',
    colorText: '#1d1d1f', colorTextSecondary: '#6e6e73',
    colorBorder: '#d2d2d7', colorBgLayout: '#f5f5f7',
    borderRadius: 12, controlHeight: 40, controlHeightSM: 32, controlHeightLG: 46,
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang SC", sans-serif'
  },
  components: {
    Button: {
      borderRadius: 11, borderRadiusSM: 9, fontWeight: 500,
      paddingInline: 14, paddingInlineSM: 10,
      defaultColor: '#303034', defaultBorderColor: '#d2d2d7',
      defaultHoverBg: '#f5f5f7', defaultHoverColor: '#1d1d1f', defaultHoverBorderColor: '#b5b5bc',
      defaultShadow: '0 1px 2px #0000000a', primaryShadow: '0 1px 2px #005bcc26',
      textHoverBg: '#00000006'
    },
    Table: { headerBg: '#f5f5f7', headerColor: '#6e6e73', borderColor: '#ededf0', rowHoverBg: '#f5f8ff' },
    Modal: { titleFontSize: 22, borderRadiusLG: 24 },
    Segmented: { trackBg: '#e9e9ed', itemSelectedBg: '#ffffff', itemSelectedColor: '#1d1d1f' },
    Tag: { defaultBg: '#f0f0f3', defaultColor: '#636369' },
    Input: { activeShadow: '0 0 0 3px #007aff20' },
    Select: { optionSelectedBg: '#e8f2ff', optionSelectedColor: '#007aff', optionActiveBg: '#f0f6ff' },
    DatePicker: { cellActiveWithRangeBg: '#e8f2ff', cellHoverBg: '#f0f6ff', activeShadow: '0 0 0 3px #007aff20', timeColumnHeight: 224 }
  }
};
