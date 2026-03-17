"use client";

import { usePlayerStore } from "@/store/playerStore";
import { X, ChevronUp, ChevronDown, Play } from "lucide-react";
import { QueueItem } from "@/store/playerStore";
import { useRouter } from "next/navigation";

interface QueueItemProps {
    item: QueueItem;
    index: number;
    isCurrent: boolean;
}

function QueueItemComponent({ item, index, isCurrent }: QueueItemProps) {
    const { removeFromQueue, playFromQueue, currentQueueIndex } = usePlayerStore();
    const router = useRouter();
    const isNowPlaying = currentQueueIndex === index;

    const handlePlay = () => {
        const queueItem = playFromQueue(index);
        if (queueItem) {
            router.push(`/watch/${queueItem.videoId}`);
        }
    };

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isNowPlaying ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" : ""
                }`}
            onClick={handlePlay}
        >
            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative">
                {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-xs">No img</span>
                    </div>
                )}
                {isNowPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{item.title || "Untitled"}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {item.channelName || "Unknown channel"}
                </p>
                {item.duration && (
                    <p className="text-xs text-gray-400">{item.duration}</p>
                )}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(item.videoId);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export default function QueuePanel() {
    const { queue, isQueueVisible, toggleQueueVisibility, clearQueue } = usePlayerStore();

    if (queue.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-80 max-h-96 overflow-hidden">
                {/* Header */}
                <div
                    className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                    onClick={toggleQueueVisibility}
                >
                    <h3 className="font-medium text-sm">
                        Next up ({queue.length})
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearQueue();
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            Clear all
                        </button>
                        {isQueueVisible ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronUp className="w-4 h-4" />
                        )}
                    </div>
                </div>

                {/* Queue list */}
                {isQueueVisible && (
                    <div className="max-h-80 overflow-y-auto">
                        {queue.map((item, index) => (
                            <QueueItemComponent
                                key={item.videoId}
                                item={item}
                                index={index}
                                isCurrent={false} // TODO: track current playing index
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}