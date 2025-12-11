import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './SignUp.css';

function SignUp() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: '',
        studentnumber: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false); // 서버 요청 상태 확인

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const validateStep = () => {
        const newErrors = {};
        if (step === 1) {
            if (!formData.terms) newErrors.terms = "서비스 약관에 동의해야 합니다.";
            if (!formData.privacy) newErrors.privacy = "개인 정보 수집 및 이용에 동의해야 합니다.";
        } else if (step === 2) {
            if (!formData.password) newErrors.password = "비밀번호를 입력해주세요.";
            if (!formData.confirmPassword) newErrors.confirmPassword = "비밀번호 확인을 입력해주세요.";
            if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "비밀번호가 다릅니다.";
            if (!formData.name) newErrors.name = "이름을 입력해주세요.";
            if (!formData.email) newErrors.email = "이메일을 입력해주세요.";
            if (!formData.phone) newErrors.phone = "전화번호를 입력해주세요.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep()) setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

   const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (validateStep()) {
            setIsSubmitting(true);
            
            try {
                const response = await fetch('https://www.teamplate-api.site/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: formData.studentnumber,
                        name: formData.name,
                        pwd: formData.password,
                        email: formData.email,
                        phone: formData.phone,
                    }),
                });

                // 1. 409 Conflict (중복) 처리 추가
                // API 명세와 달리 실제 서버는 409를 반환하므로 이 코드가 실행됩니다.
                if (response.status === 409) {
                    const errorData = await response.json();
                    // 서버에서 보낸 "이미 존재하는 학번입니다" 메시지를 그대로 출력
                    alert(errorData.message); 
                    setIsSubmitting(false); // 로딩 해제
                    return; // 함수 종료 (catch로 넘어가지 않음)
                }

                // 2. 그 외의 에러 처리 (500 등)
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || '회원가입에 실패했습니다.');
                }
                
                // 3. 성공 (200 OK)
                // 성공 시 응답 본문이 비어있을 수도, JSON일 수도 있으므로 안전하게 처리
                const responseText = await response.text();
                try {
                     const result = JSON.parse(responseText);
                     console.log('회원가입 성공:', result);
                } catch (e) {
                     console.log('회원가입 성공 (Text):', responseText);
                }

                alert("회원가입이 완료되었습니다.");
                setStep(3); 

            } catch (error) {
                // response.ok가 false이고 409가 아닌 경우 이곳으로 옵니다.
                console.error('회원가입 요청 오류:', error.message);
                alert('서버 요청 중 문제가 발생했습니다. 관리자에게 문의하세요.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="SignUp">
            <h2>회원가입</h2>
            <div className="signup-progress">
                <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
                <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
            </div>
            <div className="signup-content">
                <form className="signup-form" onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div className="step">
                            <h3>약관 동의</h3>
                            <div className="form-group">
                                <label>서비스 약관 동의</label>
                                <textarea readOnly value={`서비스 약관 내용:

1. 서비스 제공: 본 서비스는 사용자가 제공한 정보를 바탕으로 특정 기능을 제공하며, 사용자는 이를 통해 제공되는 서비스에 접근할 수 있습니다.

2. 서비스의 변경 및 중단: 본 서비스는 언제든지 서비스 내용이나 기능을 변경하거나 중단할 수 있습니다. 이러한 변경 사항은 사용자에게 사전 고지 없이 즉시 적용될 수 있습니다.

3. 사용자의 의무: 사용자는 서비스를 이용함에 있어 타인의 권리를 침해하거나 불법적인 활동을 하지 않으며, 서비스 이용 시 발생하는 모든 행위에 대해 책임을 집니다.

4. 개인정보 보호: 본 서비스는 사용자의 개인정보를 보호하기 위해 최선을 다하며, 사용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만, 법적으로 요구되는 경우에는 예외로 할 수 있습니다.

5. 서비스 약관의 변경: 본 서비스 약관은 필요에 따라 변경될 수 있으며, 변경 시 변경된 사항을 사용자에게 고지합니다.`} />
                                <input type="checkbox" name="terms" onChange={handleChange} /> 동의합니다.
                                {errors.terms && <p className="error">{errors.terms}</p>}
                            </div>
                            <div className="form-group">
                                <label>개인 정보 수집 및 이용 동의</label>
                                <textarea readOnly value={`개인정보 수집 및 이용 동의 내용:

1. 수집하는 개인정보 항목
- 이름, 이메일 주소, 연락처, 학번 등 회원 가입 및 서비스 제공을 위해 필요한 최소한의 개인정보를 수집합니다.

2. 개인정보 이용 목적
- 회원 가입 및 관리: 서비스 제공을 위한 본인 인증, 회원 관리, 고객 문의 응대 등을 위해 사용됩니다.
- 서비스 제공 및 개선: 이용자의 서비스 사용 현황 분석, 맞춤형 서비스 제공 등을 위해 사용됩니다.
- 법적 의무 이행: 법률에 의한 의무 이행을 위해 필요한 경우 개인정보를 처리할 수 있습니다.

3. 개인정보의 보유 및 이용 기간
- 회원 탈퇴 시까지 개인정보를 보유합니다. 다만, 관계 법령에 의해 일정 기간 보관해야 하는 경우 해당 기간 동안 보유합니다.

4. 개인정보의 제3자 제공
- 본 서비스는 사용자의 개인정보를 외부에 제공하지 않습니다. 다만, 사용자의 사전 동의가 있거나 법적 의무가 있는 경우 예외적으로 제공될 수 있습니다.

5. 개인정보 처리 위탁
- 본 서비스는 외부 업체에 개인정보 처리 업무를 위탁할 수 있으며, 위탁된 업체는 개인정보 보호 의무를 다할 의무가 있습니다.`} />
                                <input type="checkbox" name="privacy" onChange={handleChange} /> 동의합니다.
                                {errors.privacy && <p className="error">{errors.privacy}</p>}
                            </div>
                            <button type="button" onClick={nextStep}>다음</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step">
                            <h3>정보 입력</h3>
                            <div className="form-group">
                                <label htmlFor="studentnumber">학번</label>
                                <input type="text" id="studentnumber" name="studentnumber" value={formData.studentnumber} onChange={handleChange} required />
                                {errors.studentnumber && <p className="error">{errors.studentnumber}</p>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">비밀번호</label>
                                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                                {errors.password && <p className="error">{errors.password}</p>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm-password">비밀번호 확인</label>
                                <input type="password" id="confirm-password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                                {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="name">이름</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                                {errors.name && <p className="error">{errors.name}</p>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">이메일</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                                {errors.email && <p className="error">{errors.email}</p>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">전화번호</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                                {errors.phone && <p className="error">{errors.phone}</p>}
                            </div>

                            <div className="second-button">
                                <button type="button" onClick={prevStep}>이전</button>
                                <button type="submit" disabled={isSubmitting}>다음</button>
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="step">
                            <h3>가입 완료</h3>
                            <p>가입이 완료되었습니다. 아래 버튼을 클릭하여 로그인하세요.</p>
                            <Link to="/Login">
                                <button type="button">회원가입 완료</button>
                            </Link>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default SignUp;
