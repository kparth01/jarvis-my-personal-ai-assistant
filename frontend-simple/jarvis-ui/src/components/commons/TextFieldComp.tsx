import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

export default function TextFieldComp({ label, 
    id, 
    value,
    onChange
}: { label: string, id: string, value: string, onChange: any }) {
    return (
    <Box sx={{ flex: 1 }}>
        <TextField fullWidth 
            label={label} 
            id={id}
            value={value}
            onChange={onChange}
            variant="outlined"
            required
        />
    </Box>
    )
}
