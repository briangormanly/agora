/**
 * Agora - Close the loop
 * © 2021-2022 Brian Gormanly
 * BSD 3-Clause License
 * see included LICENSE or https://opensource.org/licenses/BSD-3-Clause 
 */

function completedAssessmentQuestion() {
    this.id = -1;
    this.completedAssessmentId = -1;
    this.assessmentQuestionId = -1;
    this.assessmentQuestionOptionId = -1;
    this.createTime;
}

exports.emptyCompletedAssessmentQuestion = () => {
    return new completedAssessmentQuestion();
}

exports.ormCompletedAssessmentQuestion = function (row) {
    let completedAssessmentQuestion = exports.emptyCompletedAssessmentQuestion();
    completedAssessmentQuestion.id = row.id;
    completedAssessmentQuestion.completedAssessmentId = row.completed_assessment_id;
    completedAssessmentQuestion.assessmentQuestionId = row.assessment_question_id;
    completedAssessmentQuestion.assessmentQuestionOptionId = row.assessment_question_option_id;
    completedAssessmentQuestion.createTime = row.create_time;
    return completedAssessmentQuestion;
}