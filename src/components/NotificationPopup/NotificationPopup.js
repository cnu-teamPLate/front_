import React, { useState, useEffect } from 'react';
import './NotificationPopup.css';
import { IoNotificationsOutline } from "react-icons/io5";

export function NotificationPopup({ notifications }) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewComment, setHasNewComment] = useState(false);

    useEffect(() => {
        if (notifications.length > 0) {
            setHasNewComment(true);
        }
    }, [notifications]);

    const togglePopup = () => {
        setIsOpen(!isOpen);
        if (isOpen) {
            setHasNewComment(false);
        }
    };

    return (
        <div className={`notification-container ${isOpen ? 'open' : ''}`}>
            <div
                className="notification-icon"
                onClick={togglePopup}
            >
                <IoNotificationsOutline size={20} />
                {hasNewComment && !isOpen && <div className="new-notification-dot"></div>}
            </div>

            {isOpen && (
                <div className="notification-popup">
                    {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                            <div key={index} className="notification-item">
                                <strong>{notification.nickname}</strong>: {notification.comment}
                            </div>
                        ))
                    ) : (
                        <p>새 알림 없음</p>
                    )}
                </div>
            )}
        </div>
    );
}