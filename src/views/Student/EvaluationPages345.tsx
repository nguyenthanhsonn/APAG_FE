'use client';

import { Upload, ChevronDown, ChevronUp } from 'lucide-react';
import type { EvaluationPageProps as Props } from '@/types/student';

export const EvaluationPages345 = (props: Props) => {
  const {
    expandedSections,
    toggleSection,
    politicalActivity,
    setPoliticalActivity,
    culturalActivity,
    setCulturalActivity,
    clubActivity,
    setClubActivity,
    antiSocial,
    setAntiSocial,
    awardPoints,
    setAwardPoints,
    policyCompliance,
    setPolicyCompliance,
    charityWork,
    setCharityWork,
    collectiveBuilding,
    setCollectiveBuilding,
    roleType,
    setRoleType,
    cadrePosition,
    setCadrePosition,
    cadrePerformance,
    setCadrePerformance,
    managementLevel,
    setManagementLevel,
    classParticipation,
    setClassParticipation,
    specialAchievement,
    setSpecialAchievement,
    showScores,
    scores,
  } = props;

  return (
    <>
      {/* TRANG 3: Mục III - Hoạt động CT-XH */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div 
          className="p-4 sm:p-6 cursor-pointer flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100 rounded-t-xl"
          onClick={() => toggleSection('page3')}
        >
          <div className="min-w-0 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-green-900">TRANG 3</h2>
            <h3 className="text-base sm:text-lg font-semibold text-green-700 mt-1 leading-snug">
              III. Hoạt động chính trị, xã hội, văn hóa, thể thao (Tối đa 20 điểm)
            </h3>
          </div>
          {expandedSections.page3 ? <ChevronUp size={20} className="shrink-0" /> : <ChevronDown size={20} className="shrink-0" />}
        </div>

        {expandedSections.page3 && (
          <div className="p-6 space-y-6">
            {/* Mục 1 */}
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-4">
                1. Tham gia hoạt động chính trị, xã hội (0-5 điểm)
              </h4>
              <select
                value={politicalActivity}
                onChange={(e) => setPoliticalActivity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="full">Tham gia và chấp hành tốt các hoạt động (5 điểm)</option>
                <option value="absent1">Vắng 01 buổi không có lý do (3 điểm)</option>
                <option value="absent2">Vắng 02 buổi không có lý do (2 điểm)</option>
                <option value="absent3plus">Vắng từ 02 buổi trở lên hoặc không tham gia (0 điểm)</option>
              </select>
            </div>

            {/* Mục 2 */}
            <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-4">
                2. Văn hóa, văn nghệ, thể thao (0-5 điểm)
              </h4>
              <select
                value={culturalActivity}
                onChange={(e) => setCulturalActivity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="full_effective">Tham gia đầy đủ, có hiệu quả (5 điểm)</option>
                <option value="over50">Tham gia có hiệu quả từ 50% trở lên (3 điểm)</option>
                <option value="encourage">Tích cực vận động mọi người tham gia (2 điểm)</option>
                <option value="under50">Vắng trên 50% số buổi (1 điểm)</option>
                <option value="none">Không tham gia (0 điểm)</option>
              </select>
            </div>

            {/* Mục 3 */}
            <div className="p-6 bg-pink-50 rounded-lg border border-pink-200">
              <h4 className="font-semibold text-gray-900 mb-4">
                3. Tham gia CLB, Đội, Nhóm (0-5 điểm)
              </h4>
              <select
                value={clubActivity}
                onChange={(e) => setClubActivity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="full_effective">Tham gia đầy đủ, có hiệu quả (5 điểm)</option>
                <option value="active">Tham gia tích cực, có hiệu quả từ 01 hoạt động trở lên (3 điểm)</option>
                <option value="member">Là thành viên tích cực hưởng ứng (2 điểm)</option>
                <option value="under50">Vắng trên 50% số buổi (1 điểm)</option>
                <option value="none">Không tham gia (0 điểm)</option>
              </select>
            </div>

            {/* Mục 4 */}
            <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-gray-900 mb-4">
                4. Tuyên truyền, phòng chống tội phạm và TNXH (0-3 điểm)
              </h4>
              <select
                value={antiSocial}
                onChange={(e) => setAntiSocial(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="very_active">Tham gia tích cực nhiều hoạt động hoặc có ý thức tố giác TNXH (3 điểm)</option>
                <option value="active">Tham gia một hoạt động đạt hiệu quả (2 điểm)</option>
                <option value="aware">Có ý thức tham gia hoặc hưởng ứng (1 điểm)</option>
                <option value="warned">Bị nhắc nhở 1 lần do vi phạm TNXH (0 điểm)</option>
              </select>
            </div>

            {/* Mục 5 */}
            <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-gray-900 mb-4">
                5. Được khen thưởng, biểu dương trong các hoạt động (0-2 điểm)
              </h4>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập điểm (tối đa 2 điểm)
              </label>
              <input
                type="number"
                min="0"
                max="2"
                value={awardPoints}
                onChange={(e) => setAwardPoints(Math.min(parseInt(e.target.value) || 0, 2))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
              />
              <button className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                <Upload size={16} />
                Tải minh chứng (file đính kèm)
              </button>
            </div>

            {showScores && scores && (
              <div className="p-6 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl">
                <h4 className="text-lg font-bold mb-2">📊 Điểm tạm tính Mục III</h4>
                <p className="text-5xl font-bold mb-3">{scores.score3} <span className="text-2xl">/ 20 điểm</span></p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TRANG 4: Mục IV - Ý thức công dân */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div 
          className="p-4 sm:p-6 cursor-pointer flex items-center justify-between bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-t-xl"
          onClick={() => toggleSection('page4')}
        >
          <div className="min-w-0 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-yellow-900">TRANG 4</h2>
            <h3 className="text-base sm:text-lg font-semibold text-yellow-700 mt-1 leading-snug">
              IV. Đánh giá về ý thức công dân trong quan hệ cộng đồng (Tối đa 25 điểm)
            </h3>
          </div>
          {expandedSections.page4 ? <ChevronUp size={20} className="shrink-0" /> : <ChevronDown size={20} className="shrink-0" />}
        </div>

        {expandedSections.page4 && (
          <div className="p-6 space-y-6">
            {/* Mục 1 */}
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-4">
                1. Chấp hành chủ trương, chính sách, pháp luật (0-10 điểm)
              </h4>
              <select
                value={policyCompliance}
                onChange={(e) => setPolicyCompliance(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="awarded">Chấp hành đúng và tuyên truyền tốt, được khen thưởng (10 điểm)</option>
                <option value="good_propaganda">Chấp hành đúng và tuyên truyền tốt (8 điểm)</option>
                <option value="comply">Chấp hành đúng các quy định (5 điểm)</option>
                <option value="warned">Bị nhắc nhở, lập biên bản do vi phạm (0 điểm)</option>
              </select>
              {policyCompliance === 'awarded' && (
                <button className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                  <Upload size={16} />
                  Tải minh chứng (file đính kèm)
                </button>
              )}
            </div>

            {/* Mục 2 */}
            <div className="p-6 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-4">
                2. Hoạt động nhân đạo, từ thiện, tình nguyện (0-10 điểm)
              </h4>
              <select
                value={charityWork}
                onChange={(e) => setCharityWork(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="awarded">Tích cực, nhiệt tình, được khen thưởng (10 điểm)</option>
                <option value="active">Tham gia tích cực, được ghi nhận (8 điểm)</option>
                <option value="aware">Có ý thức tham gia hoặc hưởng ứng (5 điểm)</option>
                <option value="disruptive">Tham gia nhưng gây mất đoàn kết (0 điểm)</option>
                <option value="none">Không tham gia (0 điểm)</option>
              </select>
              {charityWork === 'awarded' && (
                <button className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                  <Upload size={16} />
                  Tải minh chứng (file đính kèm)
                </button>
              )}
            </div>

            {/* Mục 3 */}
            <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-4">
                3. Xây dựng tập thể, giữ gìn môi trường (0-5 điểm)
              </h4>
              <select
                value={collectiveBuilding}
                onChange={(e) => setCollectiveBuilding(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="good">Có ý thức xây dựng tập thể, giữ gìn môi trường văn minh (5 điểm)</option>
                <option value="warned1">Bị nhắc nhở hoặc kiểm điểm 1 lần (1 điểm)</option>
                <option value="warned2">Bị nhắc nhở hoặc kiểm điểm 2 lần (0 điểm)</option>
              </select>
            </div>

            {showScores && scores && (
              <div className="p-6 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl">
                <h4 className="text-lg font-bold mb-2">📊 Điểm tạm tính Mục IV</h4>
                <p className="text-5xl font-bold mb-3">{scores.score4} <span className="text-2xl">/ 25 điểm</span></p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TRANG 5: Mục V - Vai trò cán bộ */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div 
          className="p-4 sm:p-6 cursor-pointer flex items-center justify-between bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-xl"
          onClick={() => toggleSection('page5')}
        >
          <div className="min-w-0 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-purple-900">TRANG 5</h2>
            <h3 className="text-base sm:text-lg font-semibold text-purple-700 mt-1 leading-snug">
              V. Vai trò cán bộ lớp, BCH Đoàn, Hội, CLB (Tối đa 10 điểm)
            </h3>
          </div>
          {expandedSections.page5 ? <ChevronUp size={20} className="shrink-0" /> : <ChevronDown size={20} className="shrink-0" />}
        </div>

        {expandedSections.page5 && (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-semibold text-yellow-900">⚠️ LƯU Ý: Chọn 1 trong 2 vai trò</p>
              <p className="text-sm text-yellow-700 mt-1">Mỗi sinh viên chỉ được tối đa 10 điểm cho mục này</p>
            </div>

            {/* Chọn vai trò */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label 
                className={`p-6 border-2 rounded-xl cursor-pointer transition ${
                  roleType === 'cadre' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-300 bg-white hover:border-purple-300'
                }`}
              >
                <input
                  type="radio"
                  name="roleType"
                  checked={roleType === 'cadre'}
                  onChange={() => setRoleType('cadre')}
                  className="sr-only"
                />
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    roleType === 'cadre' ? 'border-purple-500' : 'border-gray-300'
                  }`}>
                    {roleType === 'cadre' && <div className="w-3 h-3 rounded-full bg-purple-500"></div>}
                  </div>
                  <span className="font-semibold text-gray-900">Cán bộ lớp, BCH Đoàn, Hội, CLB</span>
                </div>
                <p className="text-sm text-gray-600 ml-9">
                  Lớp trưởng, Bí thư, Chủ nhiệm, Ủy viên...
                </p>
              </label>

              <label 
                className={`p-6 border-2 rounded-xl cursor-pointer transition ${
                  roleType === 'regular' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-white hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="roleType"
                  checked={roleType === 'regular'}
                  onChange={() => setRoleType('regular')}
                  className="sr-only"
                />
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    roleType === 'regular' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    {roleType === 'regular' && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                  </div>
                  <span className="font-semibold text-gray-900">Sinh viên thường</span>
                </div>
                <p className="text-sm text-gray-600 ml-9">
                  Tất cả sinh viên trong lớp
                </p>
              </label>
            </div>

            {/* Nếu là cán bộ */}
            {roleType === 'cadre' && (
              <div className="space-y-6">
                <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    a) Ý thức, tinh thần, thái độ (0-7 điểm)
                  </h4>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chức vụ
                  </label>
                  <select
                    value={cadrePosition}
                    onChange={(e) => setCadrePosition(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                  >
                    <option value="main_leader">Lớp trưởng, Bí thư, Chủ nhiệm</option>
                    <option value="sub_leader">Ủy viên, Tổ trưởng</option>
                  </select>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức độ hoàn thành
                  </label>
                  <select
                    value={cadrePerformance}
                    onChange={(e) => setCadrePerformance(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="excellent">Hoàn thành xuất sắc (được khen thưởng) - 7 điểm</option>
                    <option value="good">Hoàn thành tốt nhiệm vụ - 6 điểm</option>
                    <option value="complete">Hoàn thành nhiệm vụ - {cadrePosition === 'main_leader' ? '4' : '5'} điểm</option>
                    <option value="incomplete">Không hoàn thành nhiệm vụ - 0 điểm</option>
                  </select>

                  {cadrePerformance === 'excellent' && (
                    <button className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                      <Upload size={16} />
                      Tải minh chứng (file đính kèm)
                    </button>
                  )}
                </div>

                <div className="p-6 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    b) Kỹ năng tổ chức, quản lý (0-3 điểm)
                  </h4>
                  <select
                    value={managementLevel}
                    onChange={(e) => setManagementLevel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="head">Cấp trưởng (Liên chi đoàn, Lớp SV, Chi đoàn, Chi bộ, Chủ nhiệm CLB) - 3 điểm</option>
                    <option value="deputy">Cấp Phó (Lớp SV, Chi đoàn, Chi bộ, CLB) - 2 điểm</option>
                    <option value="member">Ủy viên (BCH Đoàn, Hội, CLB) - 1 điểm</option>
                  </select>
                </div>
              </div>
            )}

            {/* Nếu là sinh viên thường */}
            {roleType === 'regular' && (
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    a) Tham gia hoạt động lớp, khoa, Học viện (0-3 điểm)
                  </h4>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nhập điểm (từ 1 đến 3)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={classParticipation}
                    onChange={(e) => setClassParticipation(Math.min(Math.max(parseInt(e.target.value) || 0, 0), 3))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0-3 điểm"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Sinh viên tham gia đầy đủ các hoạt động, có ý kiến xây dựng tập thể vững mạnh
                  </p>
                </div>

                <div className="p-6 bg-cyan-50 rounded-lg border border-cyan-200">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    b) Thành tích đặc biệt (0-7 điểm)
                  </h4>
                  <select
                    value={specialAchievement}
                    onChange={(e) => setSpecialAchievement(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="university_level">Được khen thưởng từ cấp Học viện trở lên - 7 điểm</option>
                    <option value="faculty_level">Đạt khen thưởng từ cấp Khoa trở lên - 5 điểm</option>
                    <option value="none">Không có - 0 điểm</option>
                  </select>

                  {specialAchievement !== 'none' && (
                    <button className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                      <Upload size={16} />
                      Tải minh chứng (file đính kèm)
                    </button>
                  )}
                </div>
              </div>
            )}

            {showScores && scores && (
              <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl">
                <h4 className="text-lg font-bold mb-2">📊 Điểm tạm tính Mục V</h4>
                <p className="text-5xl font-bold mb-3">{scores.score5} <span className="text-2xl">/ 10 điểm</span></p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default EvaluationPages345;
