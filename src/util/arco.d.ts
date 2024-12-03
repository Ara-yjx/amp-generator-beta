export interface ArcoFormItem<T = any> {
  value?: T, 
  onChange?: (v: T) => void,
  disabled?: boolean,
}
