import { FormInstance } from "@arco-design/web-react";

export function addToList(form: FormInstance, field: string, valueToAdd: any) {
  const currentValue = form.getFieldValue(field);
  if (!Array.isArray(currentValue)) {
    console.error(`Exception in addToList() Field ${field} is not an array`);
    return;
  }
  const newValue = [...currentValue, valueToAdd];
  form.setFieldValue(field, newValue);
}

export function removeFromList(form: FormInstance, field: string, indexToRemove: number = -1) {
  const currentValue = form.getFieldValue(field);
  if (!Array.isArray(currentValue)) {
    console.error(`Exception in addToList() Field ${field} is not an array`);
    return;
  }
  const newValue = [...currentValue];
  const positiveIndexToRemove = indexToRemove < 0 ? currentValue.length + indexToRemove : indexToRemove;
  newValue.splice(positiveIndexToRemove, 1);
  form.setFieldValue(field, newValue);
}
