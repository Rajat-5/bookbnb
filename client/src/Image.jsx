export default function Image({src,...rest}) {
    src = src && src.includes('https://')
      ? src
      : 'https://bookbnb-rajat.onrender.com/uploads/'+src;
    return (
      <img {...rest} src={src} alt={''} />
    );
  }
