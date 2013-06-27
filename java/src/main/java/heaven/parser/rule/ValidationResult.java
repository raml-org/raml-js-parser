package heaven.parser.rule;

import java.util.List;

import org.yaml.snakeyaml.error.Mark;

public class ValidationResult
{

    private static final ValidationResult VALIDATION_OK = new ValidationResult(
            true, null, null, null);
    private boolean valid;
    private String message;
    private Mark startMark;
    private Mark endMark;

    private ValidationResult(boolean valid, String message, Mark startMark, Mark endMark)
    {
        this.valid = valid;
        this.message = message;
        this.setStartMark(startMark);
        this.setEndMark(endMark);
    }

    public boolean isValid()
    {
        return valid;
    }

    public String getMessage()
    {
        return message;
    }

    public static ValidationResult okResult()
    {
        return VALIDATION_OK;
    }

    public static ValidationResult createErrorResult(String message, Mark startMark, Mark endMark)
    {
        return new ValidationResult(false, message, startMark, endMark);
    }

    public static ValidationResult createErrorResult(String message)
    {
        return new ValidationResult(false, message, null, null);
    }

    public Mark getStartMark()
    {
        return startMark;
    }

    public void setStartMark(Mark startMark)
    {
        this.startMark = startMark;
    }

    public Mark getEndMark()
    {
        return endMark;
    }

    public void setEndMark(Mark endMark)
    {
        this.endMark = endMark;
    }

    public static boolean areValids(List<ValidationResult> validationResults)
    {
        return (validationResults.size() == 1 && validationResults.get(0).equals(ValidationResult.okResult()));
    }
}
