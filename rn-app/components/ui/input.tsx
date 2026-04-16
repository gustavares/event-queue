import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '~/lib/utils';

type InputProps = React.ComponentPropsWithoutRef<typeof TextInput>;

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
    ({ className, ...props }, ref) => {
        return (
            <TextInput
                ref={ref}
                className={cn(
                    'h-10 native:h-12 rounded-md border border-input bg-background px-3 text-base text-foreground web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 placeholder:text-muted-foreground',
                    className
                )}
                placeholderTextColor='hsl(240 3.8% 46.1%)'
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

export { Input };
