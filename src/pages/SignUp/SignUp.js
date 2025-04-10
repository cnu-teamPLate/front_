import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './SignUp.css';

function SignUp() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
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
            if (!formData.username) newErrors.username = "아이디를 입력해주세요.";
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
            setIsSubmitting(true); // 요청 시작
            try {
                const response = await fetch('http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/teamProj/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: formData.name,
                        username: formData.username,
                        pwd: formData.password,
                        email: formData.email,
                        phone: formData.phone,
                        studentNumber: formData.studentnumber,
                    }),
                });

                const contentType = response.headers.get('Content-Type');

                if (!response.ok) {
                    throw {
                        message: "Username is taken!",
                        checkbox: 400
                    };
                }
                if (response.ok) {
                    if (contentType && contentType.includes('application/json')) {
                        // JSON 응답 처리
                        const result = await response.json();
                        console.log('회원가입 성공:', result);
                    } else {
                        // 일반 텍스트 응답 처리
                        const text = await response.text();
                        console.log('회원가입 성공:', text);
                    }
                    setStep(3); // 가입 완료 단계로 이동
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || '회원가입에 실패했습니다.');
                }
            } catch (error) {
                console.error('회원가입 요청 오류:', error.message);
                setErrors({ server: '서버 요청 중 문제가 발생했습니다. 다시 시도해주세요.' });
            } finally {
                setIsSubmitting(false); // 요청 종료
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
                                <textarea readOnly value="약관 내용" />
                                <input type="checkbox" name="terms" onChange={handleChange} /> 동의합니다.
                                {errors.terms && <p className="error">{errors.terms}</p>}
                            </div>
                            <div className="form-group">
                                <label>개인 정보 수집 및 이용 동의</label>
                                <textarea readOnly value="개인 정보 수집 및 이용 동의 내용" />
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
                                <label htmlFor="username">닉네임</label>
                                <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                                {errors.username && <p className="error">{errors.username}</p>}
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
