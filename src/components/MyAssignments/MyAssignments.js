import React from 'react';
import './MyAssignments.css';

const MyAssignments = ({ myAssignment = [], getItemClass, isSidebar = false  }) => {
    return (
        <div className={`my-assignment ${isSidebar ? 'in-sidebar' : ''}`}>
            <h3>내 과제 보기</h3>
            {myAssignment.length > 0 ? (
                myAssignment.map((item) => (
                    <div key={item.id} className={getItemClass(item.deadline)}>
                        <p>{item.title}</p>
                        <p>{item.status}</p>
                    </div>
                ))
            ) : (
                <p>등록된 과제가 없습니다.</p>
            )}
        </div>
    );
};

export default MyAssignments;
