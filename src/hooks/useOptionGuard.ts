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
    console.log('useOptionGuards', JSON.stringify(options), value)
    if (value === undefined) return;
    const optionValues = options?.map(option => typeof option === 'object' ? option.value : option) ?? [];

    // single select
    if (!multiple) {
      const formattedValue = formatter ? formatter(value) : value;
      if (!optionValues.includes(formattedValue)) {
        if (defaultValue !== undefined && optionValues.includes(formatter ? formatter(defaultValue) : defaultValue)) {
          form.setFieldValue(field, defaultValue);
        } else {
          form.setFieldValue(field, undefined);
        }
      }

      // multi select
    } else {
      if (Array.isArray(value)) {
        const formattedValue = formatter ? value.map(formatter) : value;
        const validValues = formattedValue.filter(v => optionValues.includes(v));
        if (validValues.length != value.length) {
          form.setFieldValue(field, validValues);
        }
      }
    }

  }, [JSON.stringify(options)]);
};

export default useOptionGuards;
