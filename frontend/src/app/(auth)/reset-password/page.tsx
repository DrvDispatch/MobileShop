import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth";

function ResetPasswordContent() {
    return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
    return (
        <Card className="backdrop-blur-lg bg-white/80">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Reset your password</CardTitle>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                    <ResetPasswordContent />
                </Suspense>
            </CardContent>
        </Card>
    );
}
