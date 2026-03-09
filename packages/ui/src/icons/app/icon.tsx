export function convertToIcon(icon: string, alt?: string) {
	return function (props: React.ImgHTMLAttributes<HTMLImageElement>) {
		return <img src={icon} alt={alt ?? ''} {...props} />
	}
}
