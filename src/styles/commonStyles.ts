import { StyleSheet } from 'react-native';
import { theme } from './theme';

// 通用布局样式
export const commonStyles = StyleSheet.create({
  // 容器样式
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  paddedContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  
  // 内容区域样式
  contentContainer: {
    padding: theme.spacing.md,
  },
  
  // 卡片样式
  card: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  
  cardLarge: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  
  // 标题样式
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  
  // 搜索栏样式
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  
  searchbar: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  
  // 筛选器样式
  filterContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  
  filterRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
  },
  
  filterChip: {
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  
  filterChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  
  filterChipTextSelected: {
    color: theme.colors.textLight,
  },
  
  // 按钮样式
  primaryButton: {
    backgroundColor: theme.colors.primary,
    marginVertical: theme.spacing.sm,
  },
  
  secondaryButton: {
    borderColor: theme.colors.primary,
    marginVertical: theme.spacing.sm,
  },
  
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
  },
  
  buttonHalf: {
    flex: 0.45,
  },
  
  // FAB样式
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  
  // 列表样式
  listContainer: {
    padding: theme.spacing.md,
  },
  
  listItem: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.roundness,
    ...theme.shadows.small,
  },
  
  // 网格样式
  gridContainer: {
    padding: theme.spacing.md,
  },
  
  gridItem: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  
  // 空状态样式
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  
  emptyStateIcon: {
    marginBottom: theme.spacing.md,
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  
  emptyStateButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
  },
  
  // 表单样式
  formContainer: {
    padding: theme.spacing.md,
  },
  
  formInput: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  formInputHalf: {
    flex: 0.48,
  },
  
  // 统计数据样式
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  
  // 分割线样式
  divider: {
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.sm,
  },
  
  // 头部样式
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  
  // 用户项样式
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  
  userAvatar: {
    marginRight: theme.spacing.md,
  },
  
  userInfo: {
    flex: 1,
  },
  
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  
  userSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  
  // 模态框样式
  modal: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.roundness,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  // 阴影效果
  shadowSmall: theme.shadows.small,
  shadowMedium: theme.shadows.medium,
  shadowLarge: theme.shadows.large,
  
  // 间距辅助类
  marginXS: { margin: theme.spacing.xs },
  marginSM: { margin: theme.spacing.sm },
  marginMD: { margin: theme.spacing.md },
  marginLG: { margin: theme.spacing.lg },
  marginXL: { margin: theme.spacing.xl },
  
  paddingXS: { padding: theme.spacing.xs },
  paddingSM: { padding: theme.spacing.sm },
  paddingMD: { padding: theme.spacing.md },
  paddingLG: { padding: theme.spacing.lg },
  paddingXL: { padding: theme.spacing.xl },
  
  // 边距
  marginBottomXS: { marginBottom: theme.spacing.xs },
  marginBottomSM: { marginBottom: theme.spacing.sm },
  marginBottomMD: { marginBottom: theme.spacing.md },
  marginBottomLG: { marginBottom: theme.spacing.lg },
  marginBottomXL: { marginBottom: theme.spacing.xl },
  
  marginTopXS: { marginTop: theme.spacing.xs },
  marginTopSM: { marginTop: theme.spacing.sm },
  marginTopMD: { marginTop: theme.spacing.md },
  marginTopLG: { marginTop: theme.spacing.lg },
  marginTopXL: { marginTop: theme.spacing.xl },
  
  // 文本对齐
  textCenter: { textAlign: 'center' },
  textLeft: { textAlign: 'left' },
  textRight: { textAlign: 'right' },
  
  // Flex辅助类
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexColumn: { flexDirection: 'column' },
  justifyCenter: { justifyContent: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyAround: { justifyContent: 'space-around' },
  alignCenter: { alignItems: 'center' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
});

// 组件级别的统一样式
export const componentStyles = StyleSheet.create({
  // 衣物卡片
  clothingCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  
  // 穿搭卡片
  outfitCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  
  // 标签样式
  chip: {
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  
  chipText: {
    fontSize: 12,
  },
  
  chipTextSelected: {
    color: theme.colors.textLight,
  },
});

export default commonStyles; 