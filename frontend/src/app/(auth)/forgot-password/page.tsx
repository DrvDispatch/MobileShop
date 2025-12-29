import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth";

export default function ForgotPasswordPage() {
    return (
        <Card className="backdrop-blur-lg bg-white/80">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Forgot password?</CardTitle>
            </CardHeader>
            <CardContent>
                <ForgotPasswordForm />
            </CardContent>
        </Card>
    );
}
