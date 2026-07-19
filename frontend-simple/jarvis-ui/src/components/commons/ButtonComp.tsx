import Button from '@mui/material/Button';

export default function ButtonComp({ text } : { text: string }) { //props.text 
  return <Button type="submit" variant="contained">{text}</Button>;
}