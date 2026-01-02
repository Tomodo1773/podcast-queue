/**
 * LINE Messaging API Reply機能
 */

export type LineMessage =
	| { type: "text"; text: string }
	| { type: "flex"; altText: string; contents: FlexBubble }

export type FlexBubble = {
	type: "bubble"
	hero?: FlexImage
	body?: FlexBox
	footer?: FlexBox
}

export type FlexImage = {
	type: "image"
	url: string
	size: string
	aspectRatio: string
	aspectMode: string
}

export type FlexBox = {
	type: "box"
	layout: string
	contents: FlexComponent[]
	spacing?: string
	flex?: number
}

export type FlexComponent =
	| {
			type: "text"
			text: string
			weight?: string
			size?: string
			color?: string
			margin?: string
			wrap?: boolean
			maxLines?: number
	  }
	| { type: "button"; style: string; height: string; action: FlexAction }

export type FlexAction = {
	type: "uri"
	label: string
	uri: string
}

/**
 * LINE Reply APIを使用してメッセージを送信
 */
export async function replyMessage(replyToken: string, messages: LineMessage[]): Promise<void> {
	const accessToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN

	if (!accessToken) {
		console.error("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set")
		return
	}

	const response = await fetch("https://api.line.me/v2/bot/message/reply", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify({
			replyToken,
			messages,
		}),
	})

	if (!response.ok) {
		const errorText = await response.text()
		console.error("LINE reply failed:", response.status, errorText)
	}
}
