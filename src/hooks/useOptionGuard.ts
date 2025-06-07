import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import { OptionsType } from '@arco-design/web-react/es/Select/interface';
import { useEffect } from 'react';


/** Reset this field when value is not in options */
export function useOptionGuards(
  field: string,
  options: OptionsType,
  { multiple, formatter, defaultValue }: { multiple?: boolean, formatter?: (value: any) => string | number | undefined, defaultValue?: any } = {}, // form field value -> component option value
) {
  const { form } = useFormContext();
  useEffect(() => {
    const value = form.getFieldValue(field);
    if (value === undefined) return;

    const optionValues: (string | number)[] = [];
    if (options) {
      for (const option of options) {
        if (typeof option === 'object') {
          if (!option.disabled) {
            optionValues.push(option.value);
          }
        } else {
          optionValues.push(option);
        }
      }
    }

    if (!multiple) {
      // single select
      const formattedValue = formatter ? formatter(value) : value;
      if (!optionValues.includes(formattedValue)) {
        if (defaultValue !== undefined && optionValues.includes(formatter ? formatter(defaultValue) : defaultValue)) {
          console.log('useOptionGuards takes effect', field, value, defaultValue);
          form.setFieldValue(field, defaultValue);
        } else {
          console.log('useOptionGuards takes effect', field, value, undefined);
          form.setFieldValue(field, undefined);
        }
      }

    } else {
      // multi select
      if (Array.isArray(value)) {
        const formattedValue = formatter ? value.map(formatter) : value;
        const validSubsetValue = formattedValue.filter(v => optionValues.includes(v));
        if (validSubsetValue.length != value.length) {
          console.log('useOptionGuards takes effect', field, value, validSubsetValue);
          form.setFieldValue(field, validSubsetValue);
        }
      }
    }

  }, [serializeOptions(options)]);
};

function serializeOptions(options: OptionsType) {
  return JSON.stringify(
    options?.map(option =>
      typeof option === 'object' ? [option?.value, option?.disabled] : option
    )
  );
}

export default useOptionGuards;
