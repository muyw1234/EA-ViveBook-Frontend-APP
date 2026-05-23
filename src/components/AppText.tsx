import React from 'react';
import { Text as PaperText, TextProps as PaperTextProps } from 'react-native-paper';
import { useAccessibility } from '../context/AccessibilityContext';
import { applyFocusReading } from '../utils/focusReading';

export const AppText: React.FC<PaperTextProps<any>> = (props) => {
    const { isFocusModeEnabled } = useAccessibility();
    
    const processChildren = (children: any): any => {
        if (!isFocusModeEnabled) return children;

        if (typeof children === 'string') {
            return applyFocusReading(children);
        }
        
        if (Array.isArray(children)) {
            return React.Children.map(children, child => {
                if (typeof child === 'string') {
                    return applyFocusReading(child);
                }
                return child;
            });
        }

        return children;
    };

    return (
        <PaperText {...props}>
            {processChildren(props.children)}
        </PaperText>
    );
};
