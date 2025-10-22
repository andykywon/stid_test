module ApplicationHelper
  
  def flash_class(level)
    case level
    when :notice then "alert alert-info"
    when :error then "alert alert-danger"
    when :alert then "alert alert-warning"
    end
  end
  
  def pipe
    content_tag :span, "&nbsp;|&nbsp;".html_safe, :class => 'gray'
  end
  
  def print_current_stom_session_id
    @current_stom_session_id || "session is not available"
  end
  
end
