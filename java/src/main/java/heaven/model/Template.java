package heaven.model;

import java.util.List;

public class Template
{

    private String template;
    private List<TemplateToken> tokens;

    public Template(String template, List<TemplateToken> tokens)
    {
        this.template = template;
        this.tokens = tokens;
    }

    @Override
    public String toString()
    {
        return "Template{" +
               "template='" + template + '\'' +
               ", tokens=" + tokens +
               '}';
    }
}
