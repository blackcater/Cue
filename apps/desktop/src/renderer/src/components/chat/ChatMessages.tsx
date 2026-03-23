import { useEffect, useRef, useState } from 'react'

import type { Message } from '@/shared/ipc/types'

interface ChatMessagesProps {
	threadId: string | undefined
}

export function ChatMessages({ threadId }: Readonly<ChatMessagesProps>): React.JSX.Element {
	const [messages, setMessages] = useState<Message[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (threadId) {
			loadMessages()
		} else {
			setMessages([])
		}
	}, [threadId])

	useEffect(() => {
		// Subscribe to new messages
		const unsubscribe = window.api.on('message:new', (data) => {
			const newMessage = data as Message
			if (newMessage.threadId === threadId) {
				setMessages((prev) => [...prev, newMessage])
			}
		})

		return unsubscribe
	}, [threadId])

	useEffect(() => {
		// Scroll to bottom when messages change
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	async function loadMessages(): Promise<void> {
		if (!threadId) return

		setIsLoading(true)
		try {
			const result = await window.api.invoke<Message[]>('message:list', {
				threadId,
				limit: 100,
			})
			setMessages(result)
		} catch (error) {
			console.error('Failed to load messages:', error)
		} finally {
			setIsLoading(false)
		}
	}

	function formatTimestamp(timestamp: string): string {
		const date = new Date(timestamp)
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	}

	if (!threadId) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<span className="text-muted-foreground">Select a thread to view messages</span>
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<span className="text-muted-foreground">Loading messages...</span>
			</div>
		)
	}

	if (messages.length === 0) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<span className="text-muted-foreground">No messages yet. Start the conversation!</span>
			</div>
		)
	}

	return (
		<div className="flex flex-1 flex-col overflow-y-auto p-4">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
				{messages.map((message) => {
					const isUser = message.role === 'user'

					return (
						<div
							key={message.id}
							className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
						>
							<div
								className={`max-w-[80%] rounded-2xl px-4 py-2 ${
									isUser
										? 'rounded-none rounded-tr-2xl rounded-br-2xl bg-blue-500 text-white'
										: 'rounded-tl-2xl rounded-bl-2xl rounded-tr-none bg-green-100 text-gray-900'
								}`}
							>
								<p className="whitespace-pre-wrap break-words">{message.content}</p>
								<span
									className={`mt-1 block text-xs ${
										isUser ? 'text-blue-100' : 'text-gray-500'
									}`}
								>
									{formatTimestamp(message.timestamp)}
								</span>
							</div>
						</div>
					)
				})}
			</div>
			<div ref={messagesEndRef} />
		</div>
	)
}
