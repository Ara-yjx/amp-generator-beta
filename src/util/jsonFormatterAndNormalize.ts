import type { FormItemProps } from "@arco-design/web-react"

/** 
 * For values not natively supported by Item input. 
 * For example, boolean value in Select. 
 *   Form: boolean | undefined
 *   Input: "true" | "false" | undefined
 * */

/** form -> input */
export const jsonFormatter: FormItemProps['formatter'] = (formValue: any) => JSON.stringify(formValue);

/** input -> form */
export const jsonNormalize: FormItemProps['normalize'] = (inputValue: any) => JSON.parse(inputValue);

export const jsonFormatterAndNormalize = { formatter: jsonFormatter, normalize: jsonNormalize };

export default jsonFormatterAndNormalize;
