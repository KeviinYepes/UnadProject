package com.unad.project_video_platform.service.impl;

import com.unad.project_video_platform.dto.ForumConversationResponse;
import com.unad.project_video_platform.dto.NotificationSummaryResponse;
import com.unad.project_video_platform.dto.QuestionRequest;
import com.unad.project_video_platform.entity.Question;

import java.util.List;

public interface IForumService {
    List<ForumConversationResponse> getAllConversations();

    List<Question> getQuestionsByContent(Integer contentId);

    NotificationSummaryResponse getNotificationSummary(Integer userId);

    void markNotificationsSeen(Integer userId);

    Question createQuestion(QuestionRequest request);
}
